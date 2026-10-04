<?php

namespace Tests\Feature\Mcp;

use App\Livewire\Goal\GoalIndex;
use App\Livewire\Task\TaskList;
use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Common\DeleteEntryTool;
use App\Mcp\Tools\Context\GetPersonContextTool;
use App\Mcp\Tools\Meal\ListRecipesTool;
use App\Mcp\Tools\Meal\PlanMealTool;
use App\Mcp\Tools\Meal\UpdateRecipeTool;
use App\Mcp\Tools\Mood\LogMoodEntryTool;
use App\Mcp\Tools\Relationship\ListContactsTool;
use App\Mcp\Tools\Relationship\UpdateContactTool;
use App\Mcp\Tools\Relationship\UpdateRelationshipEventTool;
use App\Mcp\Tools\Vehicle\LogVehicleMaintenanceTool;
use App\Models\CalDavChange;
use App\Models\ExerciseLog;
use App\Models\MaintenanceTemplate;
use App\Models\MoodEntry;
use App\Models\Recipe;
use App\Models\RelationshipEvent;
use App\Models\Task;
use App\Models\TaskAssociation;
use App\Models\User;
use App\Models\VehicleMaintenanceLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Testing\TestResponse;
use Livewire\Livewire;
use Tests\TestCase;

class LifeTrackerEditingMcpTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function data(TestResponse $response): array
    {
        return (fn () => $this->structuredContent())->call($response) ?? [];
    }

    private function user(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        return $user;
    }

    private function recipe(User $user): Recipe
    {
        $recipe = $user->recipes()->create(['name' => 'Arroz con pollo', 'difficulty' => 'facil', 'meal_type' => 'almuerzo', 'nutrition' => ['calories' => 600]]);
        foreach ([['Arroz', 200, 'g'], ['Pollo', 1, 'pechuga']] as [$name, $quantity, $unit]) {
            $item = $user->shoppingItems()->create(['name' => $name, 'status' => 'available', 'stock' => 0, 'to_buy' => 0]);
            $recipe->recipeIngredients()->create(['shopping_item_id' => $item->id, 'quantity' => $quantity, 'unit' => $unit]);
        }

        return $recipe;
    }

    // ---- Recetas ---------------------------------------------------------------

    public function test_update_recipe_changes_fields_and_ingredients(): void
    {
        $user = $this->user();
        $recipe = $this->recipe($user);

        LifeTrackerServer::actingAs($user)->tool(UpdateRecipeTool::class, [
            'name' => 'arroz con pollo',
            'new_name' => 'Arroz con pollo al curry',
            'protein' => 35,
            'favorite' => true,
            'add_ingredients' => [['name' => 'Curry', 'quantity' => 1, 'unit' => 'cdta'], ['name' => 'Arroz', 'quantity' => 250, 'unit' => 'g']],
            'remove_ingredients' => ['Pollo'],
        ])->assertOk()->assertSee('Arroz con pollo al curry');

        $recipe->refresh();
        $this->assertTrue($recipe->favorite);
        $this->assertSame(['calories' => 600, 'protein' => 35], $recipe->nutrition);

        $detail = $this->data(LifeTrackerServer::actingAs($user)->tool(ListRecipesTool::class, ['recipe_id' => $recipe->id]));
        $this->assertEqualsCanonicalizing(['250 g Arroz', '1 cdta Curry'], $detail['ingredients']);

        LifeTrackerServer::actingAs($user)->tool(UpdateRecipeTool::class, [
            'recipe_id' => $recipe->id, 'ingredients' => [['name' => 'Quinoa', 'quantity' => 1, 'unit' => 'taza']],
        ])->assertOk();
        $this->assertSame(['1 taza Quinoa'], $this->data(LifeTrackerServer::actingAs($user)->tool(ListRecipesTool::class, ['recipe_id' => $recipe->id]))['ingredients']);
    }

    public function test_update_recipe_rejects_bad_input(): void
    {
        $user = $this->user();
        $recipe = $this->recipe($user);
        $user->recipes()->create(['name' => 'Lentejas', 'difficulty' => 'facil', 'meal_type' => 'almuerzo']);

        LifeTrackerServer::actingAs($user)->tool(UpdateRecipeTool::class, ['recipe_id' => $recipe->id, 'new_name' => 'lentejas'])->assertHasErrors(['Ya existe']);
        LifeTrackerServer::actingAs($user)->tool(UpdateRecipeTool::class, ['recipe_id' => $recipe->id, 'remove_ingredients' => ['Cebolla']])->assertHasErrors(['no tiene: Cebolla']);
        LifeTrackerServer::actingAs($user)->tool(UpdateRecipeTool::class, ['recipe_id' => $recipe->id])->assertHasErrors();
        LifeTrackerServer::actingAs(User::factory()->create())->tool(UpdateRecipeTool::class, ['recipe_id' => $recipe->id, 'favorite' => true])->assertHasErrors();
    }

    // ---- Borrado seguro ----------------------------------------------------------

    public function test_delete_entry_previews_then_deletes_only_with_confirmation(): void
    {
        $user = $this->user();
        $type = $user->exerciseTypes()->create(['name' => 'Trotar', 'calories_per_hour' => 600, 'steps_equivalent' => 0]);
        $log = $user->exerciseLogs()->create(['date' => today(), 'exercise_type_id' => $type->id, 'duration' => 30]);

        LifeTrackerServer::actingAs($user)->tool(DeleteEntryTool::class, ['type' => 'exercise', 'id' => $log->id])
            ->assertOk()->assertSee(['Se borraría', 'Trotar', '30 min']);
        $this->assertTrue(ExerciseLog::withoutGlobalScopes()->whereKey($log->id)->exists());

        LifeTrackerServer::actingAs(User::factory()->create())->tool(DeleteEntryTool::class, ['type' => 'exercise', 'id' => $log->id, 'confirm' => true])
            ->assertHasErrors();
        $this->assertTrue(ExerciseLog::withoutGlobalScopes()->whereKey($log->id)->exists());

        LifeTrackerServer::actingAs($user)->tool(DeleteEntryTool::class, ['type' => 'exercise', 'id' => $log->id, 'confirm' => true])
            ->assertOk()->assertSee('Borrado');
        $this->assertFalse(ExerciseLog::withoutGlobalScopes()->whereKey($log->id)->exists());
    }

    public function test_delete_task_notifies_caldav_and_clears_links(): void
    {
        $user = $this->user();
        $task = $user->tasks()->create(['title' => 'Pedir cita']);
        $event = $user->healthEvents()->create(['type' => 'appointment', 'title' => 'Cita', 'event_date' => today()]);
        TaskAssociation::link($task, $event);

        LifeTrackerServer::actingAs($user)->tool(DeleteEntryTool::class, ['type' => 'task', 'id' => $task->id, 'confirm' => true])->assertOk();

        $this->assertFalse(Task::whereKey($task->id)->exists());
        $this->assertSame(0, TaskAssociation::count());
        $this->assertTrue(CalDavChange::where('operation', 'deleted')->exists());
    }

    public function test_delete_blocks_planned_recipes_and_resyncs_goal_indicator(): void
    {
        $user = $this->user();
        $recipe = $this->recipe($user);
        LifeTrackerServer::actingAs($user)->tool(PlanMealTool::class, ['meal_type' => 'cena', 'items' => [['recipe_id' => $recipe->id]]])->assertOk();

        LifeTrackerServer::actingAs($user)->tool(DeleteEntryTool::class, ['type' => 'recipe', 'id' => $recipe->id, 'confirm' => true])
            ->assertHasErrors(['está en 1 comidas']);

        $goal = $user->goals()->create(['title' => 'Peso', 'status' => 'active', 'numeric_goal' => ['enabled' => true, 'name' => 'Peso', 'unit' => 'kg', 'direction' => 'decrease', 'startValue' => 82, 'targetValue' => 76, 'currentValue' => 79]]);
        $goal->goalNumericEntries()->create(['value' => 80, 'date' => today()->subWeek()]);
        $wrong = $goal->goalNumericEntries()->create(['value' => 79, 'date' => today()]);

        LifeTrackerServer::actingAs($user)->tool(DeleteEntryTool::class, ['type' => 'goal_value', 'id' => $wrong->id, 'confirm' => true])->assertOk();
        $this->assertEquals(80, $goal->fresh()->numeric_goal['currentValue']);
    }

    // ---- Personas, ánimo y vehículo -----------------------------------------------

    public function test_relationship_event_can_be_corrected_and_archived(): void
    {
        $user = $this->user();
        $alison = $user->relationships()->create(['full_name' => 'Alison Pino', 'nickname' => 'Ali', 'category' => 'pareja']);
        $event = RelationshipEvent::factory()->for($alison)->create(['user_id' => $user->id, 'title' => 'Entrevista', 'category' => 'other']);

        LifeTrackerServer::actingAs($user)->tool(UpdateRelationshipEventTool::class, [
            'event_id' => $event->id, 'category' => 'education-work', 'append_notes' => 'Le fue bien.', 'date' => '2026-09-30',
        ])->assertOk();

        $event->refresh();
        $this->assertSame('education-work', $event->category);
        $this->assertSame('Le fue bien.', $event->notes);
        $this->assertSame('2026-09-30', $event->starts_on->toDateString());

        LifeTrackerServer::actingAs($user)->tool(UpdateRelationshipEventTool::class, ['event_id' => $event->id, 'archived' => true])->assertOk();
        $this->assertTrue($event->fresh()->is_archived);
    }

    public function test_contact_can_be_archived_and_marked_as_contacted(): void
    {
        $user = $this->user();
        $user->relationships()->create(['full_name' => 'Natalia Montoya', 'category' => 'trabajo']);

        LifeTrackerServer::actingAs($user)->tool(UpdateContactTool::class, ['name' => 'Natalia', 'mark_contacted' => true])->assertOk();
        $this->assertNotNull($user->relationships()->first()->last_contact_at);

        LifeTrackerServer::actingAs($user)->tool(UpdateContactTool::class, ['name' => 'Natalia', 'archived' => true])->assertOk();
        $this->assertSame([], $this->data(LifeTrackerServer::actingAs($user)->tool(ListContactsTool::class))['contacts']);

        LifeTrackerServer::actingAs($user)->tool(UpdateContactTool::class, ['name' => 'Natalia', 'archived' => false])->assertOk();
        $this->assertCount(1, $this->data(LifeTrackerServer::actingAs($user)->tool(ListContactsTool::class))['contacts']);
    }

    public function test_mood_can_be_linked_to_people(): void
    {
        $user = $this->user();
        $user->relationships()->create(['full_name' => 'Alison Pino', 'nickname' => 'Ali', 'category' => 'pareja']);
        $user->moodStates()->create(['emoji' => '🥰', 'text' => 'Amado', 'value' => 5]);

        LifeTrackerServer::actingAs($user)->tool(LogMoodEntryTool::class, ['mood' => 'Amado', 'people' => ['Ali']])
            ->assertOk()->assertSee('con Ali');
        $this->assertSame(1, MoodEntry::where('user_id', $user->id)->firstOrFail()->relationships()->count());

        $context = $this->data(LifeTrackerServer::actingAs($user)->tool(GetPersonContextTool::class, ['name' => 'Ali']));
        $this->assertSame(1, $context['mood_with_person']['entries']);

        LifeTrackerServer::actingAs($user)->tool(LogMoodEntryTool::class, ['mood' => 'Amado', 'people' => ['Desconocido']])->assertHasErrors();
        $this->assertSame(1, MoodEntry::where('user_id', $user->id)->count(), 'Si una persona no existe no se registra nada.');
    }

    public function test_vehicle_maintenance_is_logged_against_its_plan(): void
    {
        $user = $this->user();
        $vehicle = $user->vehicles()->create(['name' => 'Cruze', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina', 'usage_unit' => 'km', 'current_usage' => 142000]);
        $template = MaintenanceTemplate::create(['name' => 'Cambio de aceite', 'category' => 'motor', 'vehicle_types' => ['automovil'], 'default_interval_days' => 180, 'default_interval_usage' => 5000]);
        $vehicle->maintenancePlans()->create(['maintenance_template_id' => $template->id, 'interval_days' => 180, 'interval_usage' => 5000, 'baseline_date' => '2026-04-01', 'baseline_usage' => 138000]);

        LifeTrackerServer::actingAs($user)->tool(LogVehicleMaintenanceTool::class, ['maintenance' => 'aceite', 'odometer' => 142500, 'cost' => 180000, 'provider' => 'Lubricentro'])
            ->assertOk()->assertSee('Cambio de aceite');
        LifeTrackerServer::actingAs($user)->tool(LogVehicleMaintenanceTool::class, ['maintenance' => 'frenos'])->assertHasErrors(['Cambio de aceite']);

        $this->assertSame(1, VehicleMaintenanceLog::where('user_id', $user->id)->count());
        $this->assertEquals(142500, (float) $vehicle->fresh()->current_usage);
    }

    // ---- Borrado en la web ---------------------------------------------------------

    public function test_web_delete_of_tasks_and_goals_runs_model_events(): void
    {
        $user = $this->user();
        $task = $user->tasks()->create(['title' => 'Tarea vinculada']);
        $goal = $user->goals()->create(['title' => 'Meta', 'status' => 'active']);
        TaskAssociation::link($task, $goal);
        CalDavChange::query()->delete();

        Livewire::test(TaskList::class)->call('delete', $task->id);
        $this->assertTrue(CalDavChange::where('operation', 'deleted')->exists(), 'CalDAV debe enterarse del borrado.');
        $this->assertSame(0, TaskAssociation::count());

        $other = $user->tasks()->create(['title' => 'Otra']);
        TaskAssociation::link($other, $goal);
        Livewire::test(GoalIndex::class)->call('delete', $goal->id);
        $this->assertSame(0, TaskAssociation::count());
    }
}
