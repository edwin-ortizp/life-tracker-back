<?php

namespace Tests\Feature\OAuth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Mcp\Server\Registrar;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;
use Laravel\Passport\Token;
use Tests\TestCase;

class McpOAuthFlowTest extends TestCase
{
    use RefreshDatabase;

    private const REDIRECT = 'https://claude.ai/api/mcp/auth_callback';

    private static ?\phpseclib4\Crypt\RSA\PrivateKey $testKey = null;

    protected function setUp(): void
    {
        parent::setUp();

        $previousEngine = \phpseclib4\Crypt\RSA::getForcedEngine();
        try {
            \phpseclib4\Crypt\RSA::forceEngine('PHP');
            $key = self::$testKey ??= \phpseclib4\Crypt\RSA::createKey(2048);
        } finally {
            \phpseclib4\Crypt\RSA::forceEngine($previousEngine);
        }
        config([
            'passport.private_key' => $key->toString('PKCS8'),
            'passport.public_key' => $key->getPublicKey()->toString('PKCS8'),
        ]);
    }

    public function test_a_client_completes_authorization_code_with_pkce_and_calls_a_tool(): void
    {
        $user = User::factory()->create();
        $user->habitDefinitions()->create(['name' => 'Estirar', 'time_of_day' => 'morning']);

        $accessToken = $this->connect($user);

        $headers = ['Authorization' => 'Bearer '.$accessToken, 'Accept' => 'application/json, text/event-stream'];
        $initialize = $this->postJson('/life-tracker', [
            'jsonrpc' => '2.0', 'id' => 1, 'method' => 'initialize',
            'params' => ['protocolVersion' => '2025-11-25', 'capabilities' => (object) [],
                'clientInfo' => ['name' => 'OAuth test', 'version' => '1']],
        ], $headers)->assertOk()->assertJsonPath('result.protocolVersion', '2025-11-25');
        $headers['MCP-Session-Id'] = $initialize->headers->get('MCP-Session-Id');
        $headers['MCP-Protocol-Version'] = '2025-11-25';
        $this->postJson('/life-tracker', ['jsonrpc' => '2.0', 'method' => 'notifications/initialized'], $headers)
            ->assertStatus(202)->assertContent('');
        $this->postJson('/life-tracker', ['jsonrpc' => '2.0', 'id' => 2, 'method' => 'tools/list'], $headers)
            ->assertOk()->assertJsonStructure(['result' => ['tools']]);

        $this->callMcp($accessToken, 'list-habits-tool')
            ->assertOk()
            ->assertSee('Estirar');
    }

    public function test_the_token_only_reaches_its_own_users_data(): void
    {
        // El trait BelongsToUser filtra por el guard por defecto, así que si el
        // middleware no hiciera Auth::setUser() esta prueba vería datos ajenos.
        $mine = User::factory()->create();
        $mine->habitDefinitions()->create(['name' => 'Mi hábito', 'time_of_day' => 'morning']);

        $other = User::factory()->create();
        $other->habitDefinitions()->create(['name' => 'Hábito ajeno', 'time_of_day' => 'morning']);

        $this->callMcp($this->connect($mine), 'list-habits-tool')
            ->assertOk()
            ->assertSee('Mi hábito')
            ->assertDontSee('Hábito ajeno');
    }

    public function test_a_token_without_the_mcp_scope_is_rejected(): void
    {
        // Los scopes viajan firmados dentro del propio access token, así que para
        // probar esto hay que emitir uno de verdad con otro scope, no tocar la fila.
        Passport::tokensCan([
            Registrar::OAUTH_SCOPE => 'Use MCP server',
            'otra-cosa' => 'Algo que no es MCP',
        ]);

        $user = User::factory()->create();
        $accessToken = $this->connect($user, 'otra-cosa');

        $this->callMcp($accessToken, 'list-habits-tool')->assertForbidden()
            ->assertHeader('WWW-Authenticate', 'Bearer error="insufficient_scope", scope="mcp:use", resource_metadata="'
                .url('/.well-known/oauth-protected-resource/life-tracker').'"');
    }

    public function test_revoking_the_token_cuts_access_immediately(): void
    {
        $user = User::factory()->create();
        $accessToken = $this->connect($user);

        Token::query()->update(['revoked' => true]);

        $this->callMcp($accessToken, 'list-habits-tool')->assertUnauthorized();
    }

    public function test_a_garbage_bearer_is_rejected_with_the_discovery_header(): void
    {
        $response = $this->callMcp('no-es-un-token', 'list-habits-tool');

        $response->assertUnauthorized();
        $this->assertStringContainsString('resource_metadata=', $response->headers->get('WWW-Authenticate'));
    }

    public function test_a_wrong_pkce_verifier_is_rejected(): void
    {
        $request = $this->authorizationRequest(User::factory()->create());
        $request['code_verifier'] = str_repeat('b', 64);
        $this->postJson('/oauth/token', $request)->assertStatus(400)->assertJsonPath('error', 'invalid_grant');
    }

    public function test_a_different_redirect_cannot_redeem_the_authorization_code(): void
    {
        $request = $this->authorizationRequest(User::factory()->create());
        $request['redirect_uri'] = 'https://claude.ai/another-callback';
        $this->postJson('/oauth/token', $request)->assertStatus(400)->assertJsonPath('error', 'invalid_request');
    }

    public function test_an_authorization_code_cannot_be_reused(): void
    {
        $request = $this->authorizationRequest(User::factory()->create());
        $this->postJson('/oauth/token', $request)->assertOk();
        $this->postJson('/oauth/token', $request)->assertStatus(400)->assertJsonPath('error', 'invalid_grant');
    }

    public function test_refresh_rotates_and_the_old_refresh_token_is_rejected(): void
    {
        $request = $this->authorizationRequest(User::factory()->create());
        $tokens = $this->postJson('/oauth/token', $request)->assertOk()->json();
        $refresh = ['grant_type' => 'refresh_token', 'client_id' => $request['client_id'],
            'refresh_token' => $tokens['refresh_token']];
        $rotated = $this->postJson('/oauth/token', $refresh)->assertOk()->json();
        $this->assertNotSame($tokens['refresh_token'], $rotated['refresh_token']);
        $this->callMcp($rotated['access_token'], 'list-habits-tool')->assertOk();
        $this->postJson('/oauth/token', $refresh)->assertStatus(400)->assertJsonPath('error', 'invalid_grant');
    }

    public function test_an_expired_access_token_is_rejected(): void
    {
        Passport::tokensExpireIn(now()->subMinute());
        try {
            $this->callMcp($this->connect(User::factory()->create()), 'list-habits-tool')->assertUnauthorized();
        } finally {
            Passport::tokensExpireIn(now()->addHour());
        }
    }

    private function connect(User $user, string $scope = Registrar::OAUTH_SCOPE): string
    {
        return $this->post('/oauth/token', $this->authorizationRequest($user, $scope))
            ->assertOk()->json('access_token');
    }

    private function authorizationRequest(User $user, string $scope = Registrar::OAUTH_SCOPE): array
    {
        $client = $this->registerClient();
        $verifier = str_repeat('a', 64);
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');

        $this->actingAs($user);
        $consent = $this->get('/oauth/authorize?'.http_build_query([
            'client_id' => $client->id,
            'redirect_uri' => self::REDIRECT,
            'response_type' => 'code',
            'scope' => $scope,
            'state' => 'estado',
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ]))->assertOk();

        // Se aprueba con lo que la pantalla de consentimiento pone en el formulario,
        // igual que haría el navegador del usuario.
        $approval = $this->post('/oauth/authorize', [
            'state' => $this->hiddenInput($consent->getContent(), 'state'),
            'client_id' => (string) $client->id,
            'auth_token' => $this->hiddenInput($consent->getContent(), 'auth_token'),
        ]);

        $approval->assertRedirect();
        parse_str(parse_url($approval->headers->get('Location'), PHP_URL_QUERY) ?: '', $query);
        $this->assertArrayHasKey('code', $query, 'La aprobación no devolvió un código de autorización.');

        $this->flushSession();
        $this->app['auth']->forgetGuards();

        return [
            'grant_type' => 'authorization_code',
            'client_id' => (string) $client->id,
            'redirect_uri' => self::REDIRECT,
            'code' => $query['code'],
            'code_verifier' => $verifier,
        ];
    }

    private function hiddenInput(string $html, string $name): string
    {
        preg_match('/name="'.preg_quote($name, '/').'" value="([^"]*)"/', $html, $matches);

        $this->assertNotEmpty($matches[1] ?? '', "La pantalla de consentimiento no expuso «{$name}».");

        return $matches[1];
    }

    private function registerClient(): Client
    {
        $response = $this->postJson('/oauth/register', [
            'client_name' => 'Claude',
            'redirect_uris' => [self::REDIRECT],
        ])->assertCreated();

        return Client::findOrFail($response->json('client_id'));
    }

    private function callMcp(string $accessToken, string $tool): TestResponse
    {
        return $this->postJson('/life-tracker', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'tools/call',
            'params' => ['name' => $tool, 'arguments' => []],
        ], [
            'Authorization' => 'Bearer '.$accessToken,
            'Accept' => 'application/json, text/event-stream',
        ]);
    }
}
