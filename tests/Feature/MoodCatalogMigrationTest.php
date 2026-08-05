<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\DefaultMoodStates;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The local database already holds accounts whose catalog is empty or only partially
 * seeded. The corrective migration has to leave every one of them with the complete
 * vocabulary without inventing entries or overwriting what the user edited.
 */
class MoodCatalogMigrationTest extends TestCase
{
    use RefreshDatabase;

    /** @var list<string> */
    private array $migrations = [
        '2026_08_04_000009_add_catalog_fields_to_mood_states_table',
        '2026_08_04_000010_backfill_full_mood_catalog',
    ];

    public function test_an_account_without_emotions_receives_the_complete_catalog(): void
    {
        $this->rollbackCatalogMigrations();
        $user = User::factory()->create();

        $this->applyCatalogMigrations();

        $states = DB::table('mood_states')->where('user_id', $user->id)->get();

        $this->assertCount(count(DefaultMoodStates::all()), $states);
        $this->assertCount(0, $states->whereNull('default_key'), 'Every seeded state is recognizable.');
        $this->assertCount(0, $states->where('is_active', 0), 'The catalog arrives usable.');
        $this->assertSame(0, DB::table('mood_entries')->count(), 'Repairing a catalog never invents history.');
    }

    public function test_a_partial_catalog_only_receives_the_missing_words(): void
    {
        $this->rollbackCatalogMigrations();
        $user = User::factory()->create();
        $this->seedStates($user->id, DefaultMoodStates::base());

        $this->applyCatalogMigrations();

        $this->assertSame(
            count(DefaultMoodStates::all()),
            DB::table('mood_states')->where('user_id', $user->id)->count(),
            'The words already present are matched by text instead of duplicated.'
        );

        foreach (array_column(DefaultMoodStates::all(), 'key') as $key) {
            $this->assertDatabaseHas('mood_states', ['user_id' => $user->id, 'default_key' => $key]);
        }
    }

    public function test_custom_and_edited_states_keep_their_data_and_their_entries(): void
    {
        $this->rollbackCatalogMigrations();
        $user = User::factory()->create();
        $this->seedStates($user->id, DefaultMoodStates::base());

        // A default whose emoji the user changed: matched by text, but never rewritten.
        DB::table('mood_states')->where('user_id', $user->id)->where('text', 'Feliz')
            ->update(['emoji' => '🥳']);

        $customId = $this->seedStates($user->id, [
            ['emoji' => '🦄', 'text' => 'Mi estado propio', 'value' => 7, 'category' => 'Emocional'],
        ])['Mi estado propio'];
        $entryId = $this->seedEntry($user->id, $customId, '🦄', 'Mi estado propio', 7);

        $this->applyCatalogMigrations();

        $custom = DB::table('mood_states')->find($customId);
        $this->assertNull($custom->default_key, 'A custom state is never claimed as a default.');
        $this->assertSame('🦄', $custom->emoji);
        $this->assertSame(1, (int) $custom->is_active);

        $happy = DB::table('mood_states')->where('user_id', $user->id)->where('text', 'Feliz')->first();
        $this->assertSame('🥳', $happy->emoji, 'The migration never overwrites visible fields.');
        $this->assertSame('feliz', $happy->default_key);

        $this->assertDatabaseHas('mood_entries', ['id' => $entryId, 'mood_state_id' => $customId]);
    }

    public function test_the_repair_is_idempotent(): void
    {
        $this->rollbackCatalogMigrations();
        $user = User::factory()->create();
        $this->applyCatalogMigrations();

        $afterFirstRun = DB::table('mood_states')->where('user_id', $user->id)->count();
        DB::table('mood_states')->where('user_id', $user->id)->where('text', 'Triste')
            ->update(['is_active' => false]);

        $this->migrationInstance('2026_08_04_000010_backfill_full_mood_catalog')->up();

        $this->assertSame($afterFirstRun, DB::table('mood_states')->where('user_id', $user->id)->count());
        $this->assertSame(
            0,
            (int) DB::table('mood_states')->where('user_id', $user->id)->where('text', 'Triste')->value('is_active'),
            'Running the repair again never reactivates a deliberate choice.'
        );
    }

    public function test_each_account_is_repaired_in_isolation(): void
    {
        $this->rollbackCatalogMigrations();
        $first = User::factory()->create();
        $second = User::factory()->create();

        $this->applyCatalogMigrations();

        foreach ([$first, $second] as $user) {
            $this->assertSame(
                count(DefaultMoodStates::all()),
                DB::table('mood_states')->where('user_id', $user->id)->count()
            );
        }
    }

    public function test_rollback_removes_only_the_new_columns(): void
    {
        $this->rollbackCatalogMigrations();
        $user = User::factory()->create();
        $this->applyCatalogMigrations();

        $gratitude = DB::table('mood_states')->where('user_id', $user->id)->where('text', 'Gratitud')->first();
        $entryId = $this->seedEntry($user->id, $gratitude->id, $gratitude->emoji, $gratitude->text, $gratitude->value);
        $states = DB::table('mood_states')->where('user_id', $user->id)->count();

        $this->rollbackCatalogMigrations();

        foreach (['default_key', 'is_active', 'is_pinned', 'sort_order'] as $column) {
            $this->assertFalse(Schema::hasColumn('mood_states', $column));
        }

        $this->assertSame($states, DB::table('mood_states')->where('user_id', $user->id)->count());
        $this->assertDatabaseHas('mood_entries', ['id' => $entryId, 'mood_state_id' => $gratitude->id]);
    }

    private function rollbackCatalogMigrations(): void
    {
        foreach (array_reverse($this->migrations) as $migration) {
            $this->migrationInstance($migration)->down();
        }
    }

    private function applyCatalogMigrations(): void
    {
        foreach ($this->migrations as $migration) {
            $this->migrationInstance($migration)->up();
        }
    }

    private function migrationInstance(string $migration): object
    {
        return require database_path("migrations/{$migration}.php");
    }

    /**
     * @param  list<array<string, mixed>>  $definitions
     * @return array<string, string> text => id
     */
    private function seedStates(int $userId, array $definitions): array
    {
        $now = now();
        $ids = [];

        foreach ($definitions as $definition) {
            $id = (string) Str::uuid();
            DB::table('mood_states')->insert([
                'id' => $id,
                'user_id' => $userId,
                'emoji' => $definition['emoji'],
                'text' => $definition['text'],
                'value' => $definition['value'],
                'category' => $definition['category'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $ids[$definition['text']] = $id;
        }

        return $ids;
    }

    private function seedEntry(int $userId, string $stateId, string $emoji, string $text, int $value): string
    {
        $id = (string) Str::uuid();

        DB::table('mood_entries')->insert([
            'id' => $id,
            'user_id' => $userId,
            'date' => '2026-08-01',
            'emoji' => $emoji,
            'text' => $text,
            'value' => $value,
            'time' => '10:00',
            'timestamp' => 1785000000,
            'mood_state_id' => $stateId,
            'source' => 'manual',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }
}
