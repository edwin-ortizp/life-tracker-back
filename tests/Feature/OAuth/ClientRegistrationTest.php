<?php

namespace Tests\Feature\OAuth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Registrar;
use Laravel\Passport\Client;
use Tests\TestCase;

class ClientRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_allowed_client_registers_itself_as_a_public_client(): void
    {
        $response = $this->postJson('/oauth/register', [
            'client_name' => 'Claude',
            'redirect_uris' => ['https://claude.ai/api/mcp/auth_callback'],
        ]);

        $response->assertCreated()
            // Cliente público: sin secreto, PKCE es lo que protege el intercambio.
            ->assertJsonPath('token_endpoint_auth_method', 'none')
            ->assertJsonPath('grant_types', ['authorization_code', 'refresh_token'])
            ->assertJsonPath('scope', Registrar::OAUTH_SCOPE)
            ->assertJsonMissing(['client_secret']);

        $client = Client::findOrFail($response->json('client_id'));
        $this->assertSame(['https://claude.ai/api/mcp/auth_callback'], $client->redirect_uris);
    }

    public function test_a_desktop_client_may_use_a_private_use_scheme(): void
    {
        $this->postJson('/oauth/register', [
            'client_name' => 'Claude Desktop',
            'redirect_uris' => ['claude://oauth/callback'],
        ])->assertCreated();
    }

    public function test_a_redirect_outside_the_allowlist_is_rejected(): void
    {
        // Sin esto, cualquiera podría registrar un cliente y llevarse el código
        // de autorización a su propio dominio. RFC 7591 pide 400, no 422.
        $this->postJson('/oauth/register', [
            'client_name' => 'Atacante',
            'redirect_uris' => ['https://no-es-mi-dominio.example/callback'],
        ])
            ->assertStatus(400)
            ->assertJsonPath('error', 'invalid_redirect_uri');

        $this->assertSame(0, Client::count());
    }

    public function test_registration_requires_at_least_one_redirect_uri(): void
    {
        $this->postJson('/oauth/register', [])
            ->assertStatus(400)
            ->assertJsonPath('error', 'invalid_redirect_uri');

        $this->assertSame(0, Client::count());
    }

    public function test_a_client_without_a_name_falls_back_to_its_redirect_host(): void
    {
        $response = $this->postJson('/oauth/register', [
            'redirect_uris' => ['https://chatgpt.com/connector_platform_oauth_redirect'],
        ])->assertCreated();

        $this->assertSame('chatgpt.com', Client::findOrFail($response->json('client_id'))->name);
    }
}
