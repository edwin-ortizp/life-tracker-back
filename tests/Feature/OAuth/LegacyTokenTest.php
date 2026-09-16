<?php

namespace Tests\Feature\OAuth;

use App\Models\IntegrationToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Conectar por OAuth no debe romper lo que ya funcionaba: los tokens de
 * integración siguen siendo válidos en sus superficies.
 */
class LegacyTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_existing_ai_token_still_reaches_the_mcp_server(): void
    {
        $user = User::factory()->create();
        $user->habitDefinitions()->create(['name' => 'Estirar', 'time_of_day' => 'morning']);
        [, $plain] = IntegrationToken::issueFor($user, 'IA / MCP', 'ai', IntegrationToken::AI_PREFIX);

        $this->callMcp($plain)->assertOk()->assertSee('Estirar');
    }

    public function test_a_revoked_ai_token_no_longer_works(): void
    {
        $user = User::factory()->create();
        [$token, $plain] = IntegrationToken::issueFor($user, 'IA / MCP', 'ai', IntegrationToken::AI_PREFIX);
        $token->forceFill(['revoked_at' => now()])->save();

        $this->callMcp($plain)->assertUnauthorized();
    }

    public function test_an_obsidian_token_still_reaches_the_rest_api(): void
    {
        $user = User::factory()->create();
        [, $plain] = IntegrationToken::issueFor($user, 'Obsidian', 'obsidian', IntegrationToken::PREFIX);

        $this->getJson('/api/v1/integrations/mood-states', [
            'Authorization' => 'Bearer '.$plain,
        ])->assertOk();
    }

    private function callMcp(string $token): TestResponse
    {
        return $this->postJson('/life-tracker', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'tools/call',
            'params' => ['name' => 'list-habits-tool', 'arguments' => []],
        ], [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json, text/event-stream',
        ]);
    }
}
