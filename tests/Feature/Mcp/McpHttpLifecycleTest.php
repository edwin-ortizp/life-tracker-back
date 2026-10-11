<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Models\IntegrationToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Mcp\Enums\ProtocolVersion;
use Tests\TestCase;

class McpHttpLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private string $bearer;

    protected function setUp(): void
    {
        parent::setUp();
        $user = User::factory()->create();
        $user->habitDefinitions()->create(['name' => 'Hábito propio', 'time_of_day' => 'morning']);
        [, $this->bearer] = IntegrationToken::issueFor($user, 'Prueba MCP', 'ai', IntegrationToken::AI_PREFIX);
    }

    public function test_http_initialization_catalog_pagination_and_tool_execution(): void
    {
        $initialize = $this->rpc('initialize', [
            'protocolVersion' => '2025-11-25', 'capabilities' => (object) [],
            'clientInfo' => ['name' => 'Lifecycle test', 'version' => '1.0'],
        ])->assertOk()->assertJsonPath('result.protocolVersion', '2025-11-25');
        $session = $initialize->headers->get('MCP-Session-Id');
        $this->assertNotEmpty($session);
        $headers = ['MCP-Session-Id' => $session, 'MCP-Protocol-Version' => '2025-11-25'];

        $this->postJson('/life-tracker', ['jsonrpc' => '2.0', 'method' => 'notifications/initialized'],
            $this->headers($headers))->assertStatus(202)->assertContent('');

        $tools = [];
        $cursor = null;
        do {
            $page = $this->rpc('tools/list', $cursor ? ['cursor' => $cursor] : [], $headers)
                ->assertOk()->assertJsonMissingPath('error')->json('result');
            $tools = [...$tools, ...$page['tools']];
            $cursor = $page['nextCursor'] ?? null;
            $this->assertLessThan(500, count($tools), 'La paginación no termina.');
        } while ($cursor);

        $server = app(LifeTrackerServer::class, ['transport' => new \Laravel\Mcp\Server\Transport\HttpTransport(
            \Illuminate\Http\Request::create('/life-tracker'), '',
        )]);
        $this->assertCount($server->createContext()->tools()->count(), $tools);
        $names = array_column($tools, 'name');
        $this->assertCount(count($names), array_unique($names));
        foreach ($tools as $tool) {
            $this->assertMatchesRegularExpression('/^[a-zA-Z0-9_.-]{1,128}$/', $tool['name']);
            $this->assertSame('object', $tool['inputSchema']['type']);
            $this->assertNotEmpty($tool['description']);
        }
        $this->assertContains('list-habits-tool', $names);
        $this->rpc('tools/call', ['name' => 'list-habits-tool', 'arguments' => (object) []], $headers)
            ->assertOk()->assertJsonMissingPath('error')->assertSee('Hábito propio');
    }

    public function test_all_advertised_protocol_versions_initialize(): void
    {
        foreach (ProtocolVersion::supported() as $version) {
            $this->rpc('initialize', ['protocolVersion' => $version, 'capabilities' => (object) [],
                'clientInfo' => ['name' => 'Test', 'version' => '1']])
                ->assertOk()->assertJsonPath('result.protocolVersion', $version);
        }
    }

    public function test_unknown_methods_and_tools_produce_json_rpc_errors(): void
    {
        $this->rpc('unknown-method')->assertOk()->assertJsonPath('error.code', -32601);
        $this->rpc('tools/call', ['name' => 'unknown-tool', 'arguments' => (object) []])
            ->assertOk()->assertJsonPath('error.code', -32602);
    }

    public function test_get_and_delete_are_explicitly_unsupported(): void
    {
        $this->get('/life-tracker')->assertStatus(405)->assertHeader('Allow', 'POST');
        $this->delete('/life-tracker')->assertStatus(405)->assertHeader('Allow', 'POST');
    }

    public function test_an_unknown_initialization_version_negotiates_a_supported_version(): void
    {
        $this->rpc('initialize', ['protocolVersion' => '2099-01-01', 'capabilities' => (object) [],
            'clientInfo' => ['name' => 'Future client', 'version' => '1']])
            ->assertOk()->assertJsonPath('result.protocolVersion', ProtocolVersion::supported()[0]);
    }

    public function test_an_unsupported_http_protocol_header_is_rejected(): void
    {
        $this->rpc('ping', [], ['MCP-Protocol-Version' => '2099-01-01'])->assertStatus(400);
    }

    public function test_an_untrusted_origin_is_rejected(): void
    {
        $this->rpc('ping', [], ['Origin' => 'https://untrusted.example'])->assertForbidden();
    }

    public function test_explicitly_allowed_origins_work_on_post_and_untrusted_origins_fail_on_get(): void
    {
        config(['mcp.allowed_origins' => ['https://trusted.example']]);
        $this->rpc('ping', [], ['Origin' => 'https://trusted.example'])->assertOk();
        $this->get('/life-tracker', ['Origin' => 'https://untrusted.example'])->assertForbidden();
    }

    public function test_bearer_cannot_read_another_users_habits(): void
    {
        User::factory()->create()->habitDefinitions()->create(['name' => 'Hábito ajeno', 'time_of_day' => 'morning']);
        $this->rpc('tools/call', ['name' => 'list-habits-tool', 'arguments' => (object) []])
            ->assertOk()->assertSee('Hábito propio')->assertDontSee('Hábito ajeno');
    }

    private function headers(array $extra = []): array
    {
        return [...$extra, 'Authorization' => 'Bearer '.$this->bearer,
            'Accept' => 'application/json, text/event-stream'];
    }

    private function rpc(string $method, array $params = [], array $headers = []): TestResponse
    {
        return $this->postJson('/life-tracker', ['jsonrpc' => '2.0', 'id' => 1,
            'method' => $method, 'params' => (object) $params], $this->headers($headers));
    }
}
