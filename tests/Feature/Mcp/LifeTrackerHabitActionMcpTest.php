<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Habit\CompleteHabitTool;
use App\Mcp\Tools\Habit\ListHabitsTool;
use App\Models\DrinkLog;
use App\Models\ExerciseLog;
use App\Models\ExerciseType;
use App\Models\HabitAction;
use App\Models\HabitDefinition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LifeTrackerHabitActionMcpTest extends TestCase
{
    use RefreshDatabase;

    public function test_completing_a_habit_with_an_auto_action_reports_the_extra_record(): void
    {
        $user = User::factory()->create();
        $water = $user->drinkTypes()->create(['name' => 'Agua', 'hydration_factor' => 1]);
        $habit = $user->habitDefinitions()->create(['name' => 'Vaso de agua', 'time_of_day' => 'morning']);
        $this->linkAction($habit->id, $user->id, 'water.log_intake', HabitAction::MODE_AUTO, [
            'drink_type_id' => $water->id,
            'amount_ml' => 250,
        ]);

        LifeTrackerServer::actingAs($user)
            ->tool(CompleteHabitTool::class, ['habit_id' => $habit->id])
            ->assertOk()
            ->assertSee('250 ml');

        $this->assertSame(1, DrinkLog::where('user_id', $user->id)->count());
    }

    public function test_a_prompt_habit_tells_the_agent_which_fields_it_needs(): void
    {
        [$user, $habit] = $this->exerciseHabit();

        LifeTrackerServer::actingAs($user)
            ->tool(CompleteHabitTool::class, ['habit_id' => $habit->id])
            ->assertOk()
            ->assertSee('action_input')
            ->assertSee('exercise_type_id');

        $this->assertSame(0, ExerciseLog::where('user_id', $user->id)->count());
    }

    public function test_the_agent_can_answer_in_the_same_call(): void
    {
        [$user, $habit, $type] = $this->exerciseHabit();

        LifeTrackerServer::actingAs($user)
            ->tool(CompleteHabitTool::class, [
                'habit_id' => $habit->id,
                'action_input' => ['exercise_type_id' => $type->id, 'duration' => 30],
            ])
            ->assertOk()
            ->assertSee('Correr');

        $this->assertSame(30, ExerciseLog::where('user_id', $user->id)->firstOrFail()->duration);
    }

    public function test_list_habits_tool_describes_the_configured_action(): void
    {
        [$user] = $this->exerciseHabit();

        LifeTrackerServer::actingAs($user)
            ->tool(ListHabitsTool::class, [])
            ->assertOk()
            ->assertSee('exercise_type_id')
            ->assertSee(HabitAction::MODE_PROMPT);
    }

    /** @return array{0: User, 1: HabitDefinition, 2: ExerciseType} */
    private function exerciseHabit(): array
    {
        $user = User::factory()->create();
        $type = $user->exerciseTypes()->create(['name' => 'Correr', 'calories_per_hour' => 600, 'steps_equivalent' => 0]);
        $habit = $user->habitDefinitions()->create(['name' => 'Hacer ejercicio', 'time_of_day' => 'morning']);
        $this->linkAction($habit->id, $user->id, 'exercise.log', HabitAction::MODE_PROMPT, []);

        return [$user, $habit, $type];
    }

    /** Sin sesión activa el trait BelongsToUser no rellena user_id, así que va a mano. */
    private function linkAction(int $habitId, int $userId, string $key, string $mode, array $config): void
    {
        $action = new HabitAction([
            'habit_id' => $habitId,
            'action_key' => $key,
            'mode' => $mode,
            'config' => $config,
        ]);
        $action->user_id = $userId;
        $action->save();
    }
}
