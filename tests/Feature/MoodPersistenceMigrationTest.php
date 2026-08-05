<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\DefaultMoodStates;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class MoodPersistenceMigrationTest extends TestCase
{
    use RefreshDatabase;

    /** @var list<string> */
    private array $migrations = [
        '2026_08_04_000005_add_context_fields_to_mood_entries_table',
        '2026_08_04_000006_create_mood_reflections_table',
        '2026_08_04_000007_backfill_nuanced_mood_states',
        '2026_08_04_000008_create_mood_entry_relationship_table',
    ];

    public function test_migrations_preserve_manual_and_imported_entries_with_their_statistics(): void
    {
        $this->rollbackModuleMigrations();
        $legacy = $this->seedLegacyMoodData();

        $before = [
            'states' => DB::table('mood_states')->count(),
            'entries' => DB::table('mood_entries')->count(),
            'imported' => DB::table('mood_entries')->where('source', 'obsidian')->count(),
            'valueSum' => (int) DB::table('mood_entries')->sum('value'),
        ];

        $this->applyModuleMigrations();

        $this->assertSame($before['entries'], DB::table('mood_entries')->count());
        $this->assertSame($before['imported'], DB::table('mood_entries')->where('source', 'obsidian')->count());
        $this->assertSame(
            $before['valueSum'],
            (int) DB::table('mood_entries')->sum('value'),
            'Historical statistics read `value`, which must be untouched.'
        );

        $manual = DB::table('mood_entries')->find($legacy['manual_entry_id']);
        $imported = DB::table('mood_entries')->find($legacy['imported_entry_id']);

        $this->assertNull($manual->intensity, 'No context is invented for existing rows.');
        $this->assertNull($manual->situation);
        $this->assertSame('obsidian', $imported->source);
        $this->assertSame('daily/2026-07-11.md', $imported->source_key);
    }

    public function test_the_backfill_adds_nuanced_states_without_touching_custom_ones(): void
    {
        $this->rollbackModuleMigrations();
        $legacy = $this->seedLegacyMoodData();
        $before = DB::table('mood_states')->count();

        $this->applyModuleMigrations();

        $custom = DB::table('mood_states')->find($legacy['custom_state_id']);
        $this->assertSame('Mi estado propio', $custom->text);
        $this->assertSame('🦄', $custom->emoji);
        $this->assertSame(7, (int) $custom->value);

        foreach (['Preocupación', 'Gratitud', 'Alivio'] as $text) {
            $this->assertDatabaseHas('mood_states', ['user_id' => $legacy['user_id'], 'text' => $text]);
        }

        $this->assertSame(
            $before + count(DefaultMoodStates::nuanced()),
            DB::table('mood_states')->count()
        );
    }

    public function test_the_backfill_is_idempotent(): void
    {
        $this->rollbackModuleMigrations();
        $this->seedLegacyMoodData();
        $this->applyModuleMigrations();

        $afterFirstRun = DB::table('mood_states')->count();

        $this->migrationInstance('2026_08_04_000007_backfill_nuanced_mood_states')->up();

        $this->assertSame($afterFirstRun, DB::table('mood_states')->count());
    }

    public function test_rollback_restores_the_legacy_schema_and_keeps_used_states(): void
    {
        $this->rollbackModuleMigrations();
        $legacy = $this->seedLegacyMoodData();
        $this->applyModuleMigrations();

        // A nuanced word that is now in use must survive the rollback.
        $gratitude = DB::table('mood_states')
            ->where('user_id', $legacy['user_id'])->where('text', 'Gratitud')->first();
        DB::table('mood_entries')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $legacy['user_id'],
            'date' => '2026-08-01',
            'emoji' => $gratitude->emoji,
            'text' => $gratitude->text,
            'value' => $gratitude->value,
            'time' => '10:00',
            'timestamp' => 1785000000,
            'mood_state_id' => $gratitude->id,
            'source' => 'manual',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->rollbackModuleMigrations();

        $this->assertFalse(Schema::hasTable('mood_reflections'));
        $this->assertFalse(Schema::hasTable('mood_entry_relationship'));
        $this->assertFalse(Schema::hasColumn('mood_entries', 'intensity'));
        $this->assertFalse(Schema::hasColumn('mood_entries', 'situation'));

        $this->assertSame(3, DB::table('mood_entries')->count());
        $this->assertDatabaseHas('mood_states', ['id' => $gratitude->id, 'text' => 'Gratitud']);
        $this->assertDatabaseMissing('mood_states', ['user_id' => $legacy['user_id'], 'text' => 'Alivio']);
    }

    private function rollbackModuleMigrations(): void
    {
        foreach (array_reverse($this->migrations) as $migration) {
            $this->migrationInstance($migration)->down();
        }
    }

    private function applyModuleMigrations(): void
    {
        foreach ($this->migrations as $migration) {
            $this->migrationInstance($migration)->up();
        }
    }

    private function migrationInstance(string $migration): object
    {
        return require database_path("migrations/{$migration}.php");
    }

    /** @return array<string, string|int> */
    private function seedLegacyMoodData(): array
    {
        $user = User::factory()->create();
        $now = now();

        $states = [];
        foreach (DefaultMoodStates::base() as $state) {
            $id = (string) Str::uuid();
            DB::table('mood_states')->insert([
                'id' => $id,
                'user_id' => $user->id,
                'emoji' => $state['emoji'],
                'text' => $state['text'],
                'value' => $state['value'],
                'category' => $state['category'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $states[$state['text']] = $id;
        }

        $customStateId = (string) Str::uuid();
        DB::table('mood_states')->insert([
            'id' => $customStateId,
            'user_id' => $user->id,
            'emoji' => '🦄',
            'text' => 'Mi estado propio',
            'value' => 7,
            'category' => 'Emocional',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $manualEntryId = (string) Str::uuid();
        DB::table('mood_entries')->insert([
            'id' => $manualEntryId,
            'user_id' => $user->id,
            'date' => '2026-07-10',
            'emoji' => '😊',
            'text' => 'Feliz',
            'value' => 10,
            'time' => '09:30',
            'timestamp' => 1783500000,
            'mood_state_id' => $states['Feliz'],
            'source' => 'manual',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $importedEntryId = (string) Str::uuid();
        DB::table('mood_entries')->insert([
            'id' => $importedEntryId,
            'user_id' => $user->id,
            'date' => '2026-07-11',
            'emoji' => '😢',
            'text' => 'Triste',
            'value' => 1,
            'time' => '21:00',
            'timestamp' => 1783600000,
            'mood_state_id' => $states['Triste'],
            'source' => 'obsidian',
            'source_key' => 'daily/2026-07-11.md',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return [
            'user_id' => $user->id,
            'custom_state_id' => $customStateId,
            'manual_entry_id' => $manualEntryId,
            'imported_entry_id' => $importedEntryId,
        ];
    }
}
