<?php

namespace Tests\Feature\OAuth;

use App\Livewire\Settings\SettingsPage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Registrar;
use Laravel\Passport\Client;
use Laravel\Passport\Token;
use Livewire\Livewire;
use Tests\TestCase;

class ConnectedAppsTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_lists_the_apps_connected_by_oauth(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $this->tokenFor($user, 'Claude');

        Livewire::test(SettingsPage::class)
            ->assertSee('Aplicaciones conectadas')
            ->assertSee('Claude');
    }

    public function test_revoking_an_app_cuts_its_access(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $token = $this->tokenFor($user, 'Claude');

        Livewire::test(SettingsPage::class)
            ->call('revokeConnectedApp', $token->id)
            ->assertSee('ya no tiene acceso');

        $this->assertTrue($token->fresh()->revoked);
    }

    public function test_a_user_cannot_revoke_another_users_app(): void
    {
        $mine = User::factory()->create();
        $other = User::factory()->create();
        $foreign = $this->tokenFor($other, 'Claude de otro');

        $this->actingAs($mine);

        Livewire::test(SettingsPage::class)
            ->assertDontSee('Claude de otro')
            ->call('revokeConnectedApp', $foreign->id);

        $this->assertFalse($foreign->fresh()->revoked);
    }

    private function tokenFor(User $user, string $clientName): Token
    {
        $client = Client::create([
            'name' => $clientName,
            'redirect_uris' => ['https://claude.ai/api/mcp/auth_callback'],
            'grant_types' => ['authorization_code', 'refresh_token'],
            'revoked' => false,
        ]);

        return Token::create([
            'id' => bin2hex(random_bytes(20)),
            'user_id' => $user->id,
            'client_id' => $client->id,
            'scopes' => [Registrar::OAUTH_SCOPE],
            'revoked' => false,
            'expires_at' => now()->addHour(),
        ]);
    }
}
