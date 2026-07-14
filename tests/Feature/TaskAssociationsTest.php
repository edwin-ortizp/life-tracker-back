<?php

namespace Tests\Feature;

use App\Models\Goal;
use App\Models\Relationship;
use App\Models\Task;
use App\Models\TaskAssociation;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Tests\TestCase;

class TaskAssociationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_task_can_be_linked_to_a_goal_and_a_relationship(): void
    {
        $user = User::factory()->create();
        $goal = $user->goals()->create(['title' => 'Correr 10K']);
        $circle = $user->circles()->create(['name' => 'Amistades']);
        $relationship = $user->relationships()->create([
            'circle_id' => $circle->id,
            'full_name' => 'Laura Gómez',
            'category' => 'amistad',
        ]);
        $task = $user->tasks()->create(['title' => 'Coordinar entrenamiento']);

        TaskAssociation::link($task, $goal);
        TaskAssociation::link($task, $relationship);

        $this->assertDatabaseCount('task_associations', 2);
        $this->assertTrue($task->goals()->whereKey($goal->id)->exists());
        $this->assertTrue($task->relationships()->whereKey($relationship->id)->exists());
        $this->assertTrue($goal->tasks()->whereKey($task->id)->exists());
        $this->assertTrue($relationship->tasks()->whereKey($task->id)->exists());
    }

    public function test_duplicate_links_are_not_created(): void
    {
        $user = User::factory()->create();
        $task = $user->tasks()->create(['title' => 'Planificar']);
        $goal = $user->goals()->create(['title' => 'Aprender Laravel']);

        TaskAssociation::link($task, $goal);
        TaskAssociation::link($task, $goal);

        $this->assertDatabaseCount('task_associations', 1);

        $this->actingAs($user);

        $this->expectException(QueryException::class);
        TaskAssociation::create([
            'task_id' => $task->id,
            'target_type' => 'goal',
            'target_id' => $goal->id,
        ]);
    }

    public function test_a_link_cannot_reference_another_users_resource(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $task = $owner->tasks()->create(['title' => 'Tarea privada']);
        $otherGoal = $other->goals()->create(['title' => 'Meta ajena']);

        $this->actingAs($owner);

        $this->expectException(InvalidArgumentException::class);
        TaskAssociation::link($task, $otherGoal);
    }

    public function test_deleting_a_target_removes_only_its_links(): void
    {
        $user = User::factory()->create();
        $task = $user->tasks()->create(['title' => 'Llamar']);
        $goal = $user->goals()->create(['title' => 'Meta']);
        $circle = $user->circles()->create(['name' => 'Familia']);
        $relationship = $user->relationships()->create([
            'circle_id' => $circle->id,
            'full_name' => 'Carlos',
            'category' => 'familia',
        ]);

        TaskAssociation::link($task, $goal);
        TaskAssociation::link($task, $relationship);

        $goal->delete();

        $this->assertDatabaseHas('tasks', ['id' => $task->id]);
        $this->assertDatabaseCount('task_associations', 1);
        $this->assertDatabaseHas('task_associations', [
            'task_id' => $task->id,
            'target_type' => 'relationship',
            'target_id' => $relationship->id,
        ]);
    }

    public function test_deleting_a_task_removes_its_links_and_replaces_legacy_schema(): void
    {
        $user = User::factory()->create();
        $task = $user->tasks()->create(['title' => 'Pagar seguro']);
        $goal = $user->goals()->create(['title' => 'Cuidar el carro']);

        TaskAssociation::link($task, $goal);
        $task->delete();

        $this->assertDatabaseCount('task_associations', 0);
        $this->assertTrue(Schema::hasTable('task_associations'));
        $this->assertFalse(Schema::hasTable('relationship_tasks'));
        $this->assertFalse(Schema::hasColumn('tasks', 'goal_id'));
    }

    public function test_migration_preserves_legacy_goal_and_relationship_links(): void
    {
        $migration = require database_path('migrations/2026_07_12_000001_create_task_associations_table.php');
        $migration->down();

        $user = User::factory()->create();
        $task = $user->tasks()->create(['title' => 'Migrar vínculos']);
        $goal = $user->goals()->create(['title' => 'Meta heredada']);
        $circle = $user->circles()->create(['name' => 'Contactos']);
        $relationship = $user->relationships()->create([
            'circle_id' => $circle->id,
            'full_name' => 'Marta',
            'category' => 'social',
        ]);

        DB::table('tasks')->where('id', $task->id)->update(['goal_id' => $goal->id]);
        DB::table('relationship_tasks')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'relationship_id' => $relationship->id,
            'task_id' => $task->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'goal_id' => $goal->id]);
        $this->assertDatabaseHas('relationship_tasks', ['task_id' => $task->id, 'relationship_id' => $relationship->id]);

        $migration->up();

        $this->assertDatabaseHas('task_associations', [
            'user_id' => $user->id,
            'task_id' => $task->id,
            'target_type' => 'goal',
            'target_id' => $goal->id,
        ]);
        $this->assertDatabaseHas('task_associations', [
            'user_id' => $user->id,
            'task_id' => $task->id,
            'target_type' => 'relationship',
            'target_id' => $relationship->id,
        ]);
    }
}
