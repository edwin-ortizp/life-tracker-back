<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Context\GetRecentActivityTool;
use App\Mcp\Tools\Focus\ListFocusSessionsTool;
use App\Mcp\Tools\Focus\LogFocusSessionTool;
use App\Mcp\Tools\Goal\CreateGoalTool;
use App\Mcp\Tools\Goal\ListGoalsTool;
use App\Mcp\Tools\Goal\LogGoalProgressTool;
use App\Mcp\Tools\Goal\UpdateGoalTool;
use App\Mcp\Tools\Journal\ListJournalEntriesTool;
use App\Mcp\Tools\Journal\WriteJournalEntryTool;
use App\Mcp\Tools\Meal\CreateRecipeTool;
use App\Mcp\Tools\Meal\ListMealPlanTool;
use App\Mcp\Tools\Meal\ListRecipesTool;
use App\Mcp\Tools\Meal\PlanMealTool;
use App\Mcp\Tools\NegativeHabit\ListNegativeHabitsTool;
use App\Mcp\Tools\NegativeHabit\LogNegativeHabitTool;
use App\Mcp\Tools\Vehicle\ListVehicleFillupsTool;
use App\Mcp\Tools\Vehicle\LogVehicleExpenseTool;
use App\Models\Goal;
use App\Models\JournalEntry;
use App\Models\MealPlanEntry;
use App\Models\ModuleSetting;
use App\Models\NegativeHabitLog;
use App\Models\PomodoroSession;
use App\Models\Recipe;
use App\Models\User;
use App\Models\VehicleExpense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Testing\TestResponse;
use Tests\TestCase;

class LifeTrackerModulesMcpTest extends TestCase
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

    // ---- Metas -----------------------------------------------------------------

    public function test_goal_lifecycle_with_indicator_and_progress(): void
    {
        $user = $this->user();

        LifeTrackerServer::actingAs($user)->tool(CreateGoalTool::class, [
            'title' => 'Bajar de peso', 'indicator_name' => 'Peso', 'indicator_unit' => 'kg',
            'indicator_start' => 82, 'indicator_target' => 76,
            'start_date' => today()->subDays(30)->toDateString(), 'due_date' => today()->addDays(30)->toDateString(),
        ])->assertOk();

        $goal = Goal::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('decrease', $goal->numeric_goal['direction']);

        LifeTrackerServer::actingAs($user)->tool(LogGoalProgressTool::class, ['title' => 'peso', 'value' => 79, 'note' => 'Buena semana'])
            ->assertOk()->assertSee('50%');
        LifeTrackerServer::actingAs($user)->tool(LogGoalProgressTool::class, ['goal_id' => $goal->id, 'note' => 'Primer mes completo', 'is_milestone' => true])
            ->assertOk();

        $this->assertEquals(79, $goal->fresh()->numeric_goal['currentValue']);

        $list = $this->data(LifeTrackerServer::actingAs($user)->tool(ListGoalsTool::class));
        $item = $list['goals'][0];
        $this->assertSame('Bajar de peso', $item['title']);
        $this->assertEquals(50, $item['indicator']['progress_percent']);
        $this->assertTrue($item['indicator']['on_schedule']);
        $this->assertSame(1, $item['milestones']);

        $detail = $this->data(LifeTrackerServer::actingAs($user)->tool(ListGoalsTool::class, ['title' => 'Bajar']));
        $this->assertSame('Primer mes completo', $detail['entries'][0]['text']);
        $this->assertSame('Buena semana', $detail['indicator_history'][0]['note']);

        LifeTrackerServer::actingAs($user)->tool(UpdateGoalTool::class, ['goal_id' => $goal->id, 'status' => 'completed'])->assertOk();
        $this->assertSame([], $this->data(LifeTrackerServer::actingAs($user)->tool(ListGoalsTool::class))['goals']);
    }

    public function test_goal_validation_and_isolation(): void
    {
        $user = $this->user();
        $goal = $user->goals()->create(['title' => 'Leer más', 'status' => 'active']);

        LifeTrackerServer::actingAs($user)->tool(LogGoalProgressTool::class, ['goal_id' => $goal->id, 'value' => 3])
            ->assertHasErrors(['no tiene indicador']);
        LifeTrackerServer::actingAs($user)->tool(CreateGoalTool::class, ['title' => 'X', 'indicator_name' => 'Libros'])
            ->assertHasErrors();

        $other = User::factory()->create();
        LifeTrackerServer::actingAs($other)->tool(UpdateGoalTool::class, ['goal_id' => $goal->id, 'status' => 'abandoned'])
            ->assertHasErrors();
    }

    // ---- Diario ----------------------------------------------------------------

    public function test_journal_appends_by_default_and_reads_summaries(): void
    {
        $user = $this->user();
        $user->journalEntries()->create(['date' => today(), 'text' => 'Mañana tranquila.', 'summary' => 'Día tranquilo']);
        $user->journalEntries()->create(['date' => today()->subDays(2), 'text' => str_repeat('Texto largo. ', 40)]);

        LifeTrackerServer::actingAs($user)->tool(WriteJournalEntryTool::class, ['text' => 'En la tarde fui al médico.'])->assertOk();

        $entry = JournalEntry::where('user_id', $user->id)->whereDate('date', today())->firstOrFail();
        $this->assertSame("Mañana tranquila.\n\nEn la tarde fui al médico.", $entry->text);
        $this->assertSame('Día tranquilo', $entry->summary);

        $list = $this->data(LifeTrackerServer::actingAs($user)->tool(ListJournalEntriesTool::class));
        $this->assertSame(2, $list['days_written']);
        $this->assertSame('Día tranquilo', $list['entries'][0]['summary']);
        $this->assertArrayNotHasKey('text', $list['entries'][0], 'Con resumen no se envía el texto.');
        $this->assertStringEndsWith('…', $list['entries'][1]['text']);

        $day = $this->data(LifeTrackerServer::actingAs($user)->tool(ListJournalEntriesTool::class, ['date' => today()->toDateString()]));
        $this->assertStringContainsString('médico', $day['entries'][0]['text']);

        LifeTrackerServer::actingAs($user)->tool(WriteJournalEntryTool::class, ['text' => 'x', 'date' => today()->addDay()->toDateString()])->assertHasErrors();
    }

    // ---- Comidas ---------------------------------------------------------------

    public function test_recipes_and_meal_plan(): void
    {
        $user = $this->user();

        LifeTrackerServer::actingAs($user)->tool(CreateRecipeTool::class, [
            'name' => 'Arroz con pollo', 'meal_type' => 'almuerzo', 'calories' => 600, 'favorite' => true,
            'instructions' => 'Sofreír y cocinar.',
            'ingredients' => [['name' => 'Arroz', 'quantity' => 200, 'unit' => 'g'], ['name' => 'Pollo', 'quantity' => 1, 'unit' => 'pechuga']],
        ])->assertOk();
        LifeTrackerServer::actingAs($user)->tool(CreateRecipeTool::class, ['name' => 'arroz con pollo'])->assertHasErrors();

        $recipe = Recipe::where('user_id', $user->id)->firstOrFail();
        $this->assertSame(2, $recipe->recipeIngredients()->count());

        LifeTrackerServer::actingAs($user)->tool(PlanMealTool::class, [
            'meal_type' => 'almuerzo', 'items' => [['recipe' => 'arroz con pollo', 'portions' => 1], ['name' => 'Jugo', 'calories' => 120]],
        ])->assertOk()->assertSee('720 kcal');
        // Agregar la misma receta suma porciones en vez de duplicarla.
        LifeTrackerServer::actingAs($user)->tool(PlanMealTool::class, ['meal_type' => 'almuerzo', 'items' => [['recipe_id' => $recipe->id]]])->assertOk();

        $entry = MealPlanEntry::where('user_id', $user->id)->with('items')->sole();
        $this->assertCount(2, $entry->items);
        $this->assertEquals(2, $entry->items->firstWhere('recipe_id', $recipe->id)->portions);

        $plan = $this->data(LifeTrackerServer::actingAs($user)->tool(ListMealPlanTool::class));
        $this->assertSame(1320, $plan['days'][0]['calories']);
        $this->assertSame(['Arroz con pollo ×2', 'Jugo (120 kcal)'], $plan['days'][0]['meals'][0]['items']);

        $list = $this->data(LifeTrackerServer::actingAs($user)->tool(ListRecipesTool::class, ['search' => 'pollo']));
        $this->assertSame(1, $list['recipes'][0]['times_planned']);
        $this->assertSame(today()->toDateString(), $list['recipes'][0]['last_planned_on']);

        $detail = $this->data(LifeTrackerServer::actingAs($user)->tool(ListRecipesTool::class, ['name' => 'Arroz']));
        $this->assertSame(['200 g Arroz', '1 pechuga Pollo'], $detail['ingredients']);

        LifeTrackerServer::actingAs($user)->tool(PlanMealTool::class, ['meal_type' => 'cena', 'items' => [['recipe' => 'Inexistente']]])->assertHasErrors();
    }

    // ---- Hábitos negativos y foco ------------------------------------------------

    public function test_negative_habits_compare_periods(): void
    {
        $user = $this->user();
        $habit = $user->negativeHabitDefinitions()->create(['name' => 'Redes sociales', 'category' => 'digital']);
        NegativeHabitLog::create(['habit_id' => $habit->id, 'timestamp' => now()->subDays(10)->timestamp]);

        LifeTrackerServer::actingAs($user)->tool(LogNegativeHabitTool::class, ['habit' => 'redes', 'note' => 'Aburrimiento'])->assertOk();
        LifeTrackerServer::actingAs($user)->tool(LogNegativeHabitTool::class, ['habit' => 'cigarrillo'])->assertHasErrors(['Redes sociales']);

        $data = $this->data(LifeTrackerServer::actingAs($user)->tool(ListNegativeHabitsTool::class, ['include_logs' => true]));
        $item = $data['habits'][0];
        $this->assertSame(1, $item['times']);
        $this->assertSame(1, $item['times_previous_period']);
        $this->assertSame(0, $item['days_since_last']);
        $this->assertSame('Aburrimiento', $item['logs'][0]['note']);
    }

    public function test_focus_sessions_against_daily_goal(): void
    {
        $user = $this->user();
        ModuleSetting::create(['module' => 'pomodoro', 'settings' => ['weekday_goal_minutes' => 60, 'weekend_goal_minutes' => 60]]);

        LifeTrackerServer::actingAs($user)->tool(LogFocusSessionTool::class, ['minutes' => 90, 'description' => 'Informe Siigo'])->assertOk();
        LifeTrackerServer::actingAs($user)->tool(LogFocusSessionTool::class, ['minutes' => 30, 'end' => now()->addHour()->format('Y-m-d H:i')])->assertHasErrors();

        $this->assertSame(1, PomodoroSession::where('user_id', $user->id)->count());

        $data = $this->data(LifeTrackerServer::actingAs($user)->tool(ListFocusSessionsTool::class, ['days' => 3]));
        $session = PomodoroSession::where('user_id', $user->id)->first();
        $day = collect($data['by_day'])->firstWhere('date', $session->date->toDateString());
        $this->assertSame(90, $day['minutes']);
        $this->assertTrue($day['goal_met']);
        $this->assertSame(['Informe Siigo'], $day['worked_on']);
    }

    // ---- Vehículo ----------------------------------------------------------------

    public function test_vehicle_expenses(): void
    {
        $user = $this->user();
        $user->vehicles()->create(['name' => 'Cruze', 'vehicle_type' => 'car', 'power_source' => 'gasolina', 'usage_unit' => 'km', 'fuel_volume_unit' => 'gal']);
        $user->vehicleExpenseCategories()->create(['name' => 'Peajes', 'sort_order' => 1]);
        $user->vehicleExpenseCategories()->create(['name' => 'Seguro', 'sort_order' => 2]);

        LifeTrackerServer::actingAs($user)->tool(LogVehicleExpenseTool::class, ['category' => 'peajes', 'amount' => 18500, 'description' => 'Vía a Popayán'])->assertOk();
        LifeTrackerServer::actingAs($user)->tool(LogVehicleExpenseTool::class, ['category' => 'gasolina', 'amount' => 1])->assertHasErrors(['Peajes, Seguro']);

        $this->assertSame(1, VehicleExpense::where('user_id', $user->id)->count());

        $data = $this->data(LifeTrackerServer::actingAs($user)->tool(ListVehicleFillupsTool::class, ['include_expenses' => true]));
        $this->assertSame('Peajes', $data['expenses'][0]['category']);
        $this->assertEquals(18500, $data['expenses_total']);
    }

    // ---- Actividad reciente ------------------------------------------------------

    public function test_recent_activity_includes_new_modules(): void
    {
        $user = $this->user();
        $goal = $user->goals()->create(['title' => 'Correr 10K', 'status' => 'active']);
        $goal->goalEntries()->create(['text' => 'Corrí 6 km', 'date' => today()]);
        $user->journalEntries()->create(['date' => today(), 'text' => 'Texto privado del día', 'summary' => 'Buen día']);
        $habit = $user->negativeHabitDefinitions()->create(['name' => 'Azúcar']);
        NegativeHabitLog::create(['habit_id' => $habit->id, 'timestamp' => now()->timestamp]);
        PomodoroSession::create(['date' => today(), 'start_time' => ['timestamp' => now()->subHour()->timestamp], 'end_time' => ['timestamp' => now()->timestamp], 'duration' => 3600, 'completed' => true, 'description' => 'MCP']);

        $text = json_encode($this->data(LifeTrackerServer::actingAs($user)->tool(GetRecentActivityTool::class)->assertOk()), JSON_UNESCAPED_UNICODE);

        $this->assertStringContainsString('Avance en \"Correr 10K\": Corrí 6 km', $text);
        $this->assertStringContainsString('[diario] Buen día', $text);
        $this->assertStringNotContainsString('Texto privado', $text);
        $this->assertStringContainsString('Azúcar ×1', $text);
        $this->assertStringContainsString('[foco] 60 min: MCP', $text);
    }
}
