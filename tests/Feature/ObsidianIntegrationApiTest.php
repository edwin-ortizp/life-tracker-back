<?php

namespace Tests\Feature;

use App\Livewire\Settings\SettingsPage;
use App\Models\EnergyEntry;
use App\Models\IntegrationToken;
use App\Models\JournalEntry;
use App\Models\MoodEntry;
use App\Models\MoodState;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Livewire\Livewire;
use Tests\TestCase;

class ObsidianIntegrationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_generate_and_revoke_their_obsidian_token(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $component = Livewire::test(SettingsPage::class)
            ->call('createOrRotateObsidianToken')
            ->assertSet('successMessage', 'Token de integración generado. Cópialo ahora: no volverá a mostrarse.');

        $plainTextToken = $component->get('obsidianIntegrationToken');

        $this->assertStringStartsWith(IntegrationToken::PREFIX, $plainTextToken);
        $this->assertDatabaseHas('integration_tokens', [
            'user_id' => $user->id,
            'name' => 'Obsidian / n8n',
            'token_hash' => hash('sha256', $plainTextToken),
            'revoked_at' => null,
        ]);

        $component->call('revokeObsidianToken');

        $this->assertNotNull(IntegrationToken::firstOrFail()->fresh()->revoked_at);
    }

    public function test_token_only_reads_its_own_mood_states(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $ownerState = $owner->moodStates()->create(['emoji' => '🙂', 'text' => 'Bien', 'value' => 4]);
        $otherUser->moodStates()->create(['emoji' => '😟', 'text' => 'Mal', 'value' => 2]);

        $response = $this->withToken($this->tokenFor($owner))->getJson('/api/v1/integrations/mood-states');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownerState->id);
    }

    public function test_api_creates_journal_mood_and_energy_entries_from_obsidian(): void
    {
        $user = User::factory()->create();
        $moodState = $user->moodStates()->create(['emoji' => '😀', 'text' => 'Contento', 'value' => 5]);
        $token = $this->tokenFor($user);
        $sourceKey = 'daily/2026-07-13.md';

        $this->withToken($token)->postJson('/api/v1/integrations/journal-entries', [
            'source_key' => $sourceKey,
            'date' => '2026-07-13',
            'summary' => 'Tuve un día tranquilo y productivo.',
        ])->assertCreated()->assertJsonPath('status', 'created');

        $this->withToken($token)->postJson('/api/v1/integrations/mood-entries', [
            'source_key' => $sourceKey,
            'date' => '2026-07-13',
            'time' => '20:30',
            'mood_state_id' => $moodState->id,
        ])->assertCreated();

        $this->withToken($token)->postJson('/api/v1/integrations/energy-entries', [
            'source_key' => $sourceKey,
            'date' => '2026-07-13',
            'time' => '20:30',
            'level' => 4,
            'comment' => 'Energía estable.',
        ])->assertCreated();

        $this->assertDatabaseHas('journal_entries', ['user_id' => $user->id, 'source' => 'obsidian', 'source_key' => $sourceKey]);
        $this->assertDatabaseHas('mood_entries', ['user_id' => $user->id, 'source' => 'obsidian', 'source_key' => $sourceKey, 'mood_state_id' => $moodState->id]);
        $this->assertDatabaseHas('energy_entries', ['user_id' => $user->id, 'source' => 'obsidian', 'source_key' => $sourceKey, 'level' => 4]);
    }

    public function test_repeated_source_key_does_not_update_or_duplicate_the_first_import(): void
    {
        $user = User::factory()->create();
        $token = $this->tokenFor($user);
        $payload = ['source_key' => 'daily/2026-07-12.md', 'date' => '2026-07-12', 'summary' => 'Versión inicial.'];

        $this->withToken($token)->postJson('/api/v1/integrations/journal-entries', $payload)->assertCreated();
        $this->withToken($token)->postJson('/api/v1/integrations/journal-entries', [...$payload, 'summary' => 'Versión editada.'])
            ->assertOk()
            ->assertJson(['status' => 'skipped', 'reason' => 'already_imported']);

        $this->assertSame('Versión inicial.', JournalEntry::firstOrFail()->text);
        $this->assertSame(1, JournalEntry::count());
    }

    public function test_manual_journal_does_not_block_mood_and_energy_imports(): void
    {
        $user = User::factory()->create();
        $moodState = $user->moodStates()->create(['emoji' => '😌', 'text' => 'En calma', 'value' => 4]);
        $user->journalEntries()->create(['date' => '2026-07-11', 'text' => 'Entrada manual.', 'display_time' => '10:00']);
        $token = $this->tokenFor($user);

        $this->withToken($token)->postJson('/api/v1/integrations/journal-entries', [
            'source_key' => 'daily/2026-07-11.md', 'date' => '2026-07-11', 'summary' => 'Resumen de Obsidian.',
        ])->assertOk()->assertJson(['status' => 'skipped', 'reason' => 'journal_exists']);

        $this->withToken($token)->postJson('/api/v1/integrations/mood-entries', [
            'source_key' => 'daily/2026-07-11.md', 'date' => '2026-07-11', 'time' => '21:00', 'mood_state_id' => $moodState->id,
        ])->assertCreated();
        $this->withToken($token)->postJson('/api/v1/integrations/energy-entries', [
            'source_key' => 'daily/2026-07-11.md', 'date' => '2026-07-11', 'time' => '21:00', 'level' => 3,
        ])->assertCreated();

        $this->assertSame(1, JournalEntry::count());
        $this->assertSame(1, MoodEntry::count());
        $this->assertSame(1, EnergyEntry::count());
    }

    public function test_revoked_token_and_foreign_mood_state_are_rejected(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $foreignMoodState = $otherUser->moodStates()->create(['emoji' => '😢', 'text' => 'Triste', 'value' => 1]);
        [$tokenModel, $plainTextToken] = IntegrationToken::issueFor($user, 'Obsidian / n8n');

        $this->withToken($plainTextToken)->postJson('/api/v1/integrations/mood-entries', [
            'source_key' => 'daily/2026-07-10.md', 'date' => '2026-07-10', 'time' => '18:00', 'mood_state_id' => $foreignMoodState->id,
        ])->assertUnprocessable();

        $tokenModel->update(['revoked_at' => now()]);

        $this->withToken($plainTextToken)->getJson('/api/v1/integrations/mood-states')->assertUnauthorized();
    }

    private function tokenFor(User $user): string
    {
        [, $plainTextToken] = IntegrationToken::issueFor($user, 'Obsidian / n8n');

        return $plainTextToken;
    }
}
