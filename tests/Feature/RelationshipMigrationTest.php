<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class RelationshipMigrationTest extends TestCase
{
    use RefreshDatabase;

    /** @var list<string> */
    private array $migrations = [
        '2026_08_04_000001_create_relationship_contact_methods_and_tags_tables',
        '2026_08_04_000002_add_profile_fields_to_relationships_table',
        '2026_08_04_000003_rename_events_to_relationship_events',
        '2026_08_04_000004_add_details_to_relationship_events_table',
    ];

    public function test_migrations_preserve_the_existing_relationship_inventory(): void
    {
        $this->rollbackModuleMigrations();

        $legacy = $this->seedLegacyInventory();

        $inventoryBefore = [
            'relationships' => DB::table('relationships')->count(),
            'birthdays' => DB::table('relationships')
                ->whereNotNull('birthday_month')
                ->orWhereNotNull('birthday_date')
                ->count(),
            'events' => DB::table('events')->count(),
            'associations' => DB::table('task_associations')->count(),
        ];

        $this->applyModuleMigrations();

        $this->assertSame($inventoryBefore['relationships'], DB::table('relationships')->count());
        $this->assertSame($inventoryBefore['events'], DB::table('relationship_events')->count());
        $this->assertSame($inventoryBefore['associations'], DB::table('task_associations')->count());
        $this->assertSame(
            $inventoryBefore['birthdays'],
            DB::table('relationships')->whereNotNull('birthday_month')->count(),
            'Every known birthday must survive as a normalized month and day.'
        );

        $this->assertFalse(Schema::hasTable('events'));
        $this->assertDatabaseHas('task_associations', [
            'task_id' => $legacy['task_id'],
            'target_type' => 'relationship',
            'target_id' => $legacy['relationship_with_full_birthday'],
        ]);
    }

    public function test_migrations_normalize_birthdays_without_inventing_a_year(): void
    {
        $this->rollbackModuleMigrations();
        $legacy = $this->seedLegacyInventory();
        $this->applyModuleMigrations();

        $withYear = DB::table('relationships')->find($legacy['relationship_with_full_birthday']);
        $withoutYear = DB::table('relationships')->find($legacy['relationship_with_partial_birthday']);

        $this->assertSame(1990, (int) $withYear->birthday_year);
        $this->assertSame(5, (int) $withYear->birthday_month);
        $this->assertSame(17, (int) $withYear->birthday_day);

        $this->assertNull($withoutYear->birthday_year);
        $this->assertSame(11, (int) $withoutYear->birthday_month);
        $this->assertSame(3, (int) $withoutYear->birthday_day);
    }

    public function test_migrations_convert_legacy_event_dates_into_ordered_windows(): void
    {
        $this->rollbackModuleMigrations();
        $legacy = $this->seedLegacyInventory();
        $this->applyModuleMigrations();

        $exact = DB::table('relationship_events')->find($legacy['exact_event_id']);
        $ranged = DB::table('relationship_events')->find($legacy['ranged_event_id']);

        $this->assertSame('2026-03-10', substr((string) $exact->starts_on, 0, 10));
        $this->assertSame('2026-03-10', substr((string) $exact->ends_on, 0, 10));
        $this->assertSame('day', $exact->date_precision);
        $this->assertSame('cumpleanos', $exact->category);
        $this->assertSame(0, (int) $exact->is_sensitive);

        $this->assertSame('2026-06-01', substr((string) $ranged->starts_on, 0, 10));
        $this->assertSame('2026-06-15', substr((string) $ranged->ends_on, 0, 10));
        $this->assertSame('range', $ranged->date_precision);
    }

    public function test_rollback_restores_the_legacy_schema_without_losing_history(): void
    {
        $this->rollbackModuleMigrations();
        $legacy = $this->seedLegacyInventory();
        $this->applyModuleMigrations();

        $this->rollbackModuleMigrations();

        $this->assertTrue(Schema::hasTable('events'));
        $this->assertFalse(Schema::hasTable('relationship_contact_methods'));
        $this->assertFalse(Schema::hasColumn('relationships', 'birthday_year'));
        $this->assertFalse(Schema::hasColumn('events', 'starts_on'));

        $this->assertSame(2, DB::table('events')->count());
        $this->assertSame(2, DB::table('relationships')->count());
        $this->assertSame(1, DB::table('task_associations')->count());

        $restored = DB::table('events')->find($legacy['ranged_event_id']);
        $this->assertSame('2026-06-01', substr((string) $restored->start_date, 0, 10));
        $this->assertSame('2026-06-15', substr((string) $restored->end_date, 0, 10));
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

    /** @return array<string, string> */
    private function seedLegacyInventory(): array
    {
        $user = User::factory()->create();
        $now = now();

        $circleId = (string) Str::uuid();
        DB::table('circles')->insert([
            'id' => $circleId,
            'user_id' => $user->id,
            'name' => 'Familia',
            'sort_order' => 0,
            'contact_frequency_days' => 30,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $withFullBirthday = (string) Str::uuid();
        DB::table('relationships')->insert([
            'id' => $withFullBirthday,
            'user_id' => $user->id,
            'circle_id' => $circleId,
            'full_name' => 'Alison Restrepo',
            'category' => 'familia',
            'birthday_date' => '1990-05-17',
            'birthday_month' => null,
            'birthday_day' => null,
            'is_archived' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $withPartialBirthday = (string) Str::uuid();
        DB::table('relationships')->insert([
            'id' => $withPartialBirthday,
            'user_id' => $user->id,
            'circle_id' => $circleId,
            'full_name' => 'Camilo Vargas',
            'category' => 'amistad',
            'birthday_date' => null,
            'birthday_month' => 11,
            'birthday_day' => 3,
            'is_archived' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $exactEventId = (string) Str::uuid();
        DB::table('events')->insert([
            'id' => $exactEventId,
            'user_id' => $user->id,
            'relationship_id' => $withFullBirthday,
            'title' => 'Cena de cumpleaños',
            'event_type' => 'cumpleanos',
            'event_date' => '2026-03-10',
            'is_archived' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $rangedEventId = (string) Str::uuid();
        DB::table('events')->insert([
            'id' => $rangedEventId,
            'user_id' => $user->id,
            'relationship_id' => $withPartialBirthday,
            'title' => 'Viaje a la costa',
            'event_type' => 'viaje',
            'event_date' => '2026-06-01',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-15',
            'is_archived' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $taskId = (string) Str::uuid();
        DB::table('tasks')->insert([
            'id' => $taskId,
            'user_id' => $user->id,
            'title' => 'Comprar regalo',
            'completed' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('task_associations')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'task_id' => $taskId,
            'target_type' => 'relationship',
            'target_id' => $withFullBirthday,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return [
            'relationship_with_full_birthday' => $withFullBirthday,
            'relationship_with_partial_birthday' => $withPartialBirthday,
            'exact_event_id' => $exactEventId,
            'ranged_event_id' => $rangedEventId,
            'task_id' => $taskId,
        ];
    }
}
