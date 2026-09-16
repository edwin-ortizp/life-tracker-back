<?php

namespace Tests\Feature\Habit;

use App\Models\DrinkLog;
use App\Models\DrinkType;
use App\Models\HabitAction;
use App\Models\HabitCompletion;
use App\Models\HabitDefinition;
use App\Models\User;
use App\Services\HabitGamificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HabitActionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2026-07-13 08:00:00', 'America/Bogota'));
        $this->actingAs(User::factory()->create());
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_completing_a_habit_with_an_auto_action_creates_the_linked_record(): void
    {
        $water = DrinkType::create(['name' => 'Agua', 'hydration_factor' => 1]);
        $habit = $this->habitWithAction('Vaso de agua', 'water.log_intake', HabitAction::MODE_AUTO, [
            'drink_type_id' => $water->id,
            'amount_ml' => 250,
        ]);

        $feedback = app(HabitGamificationService::class)->toggle($habit->id, '2026-07-13');

        $this->assertFalse($feedback['requiresInput']);
        $this->assertStringContainsString('250 ml', $feedback['actionResult']);

        $log = DrinkLog::sole();
        $this->assertSame(250, (int) $log->amount);
        $this->assertSame(250, (int) $log->hydration_value);

        $completion = HabitCompletion::sole();
        $this->assertSame('drink-log', $completion->actionable_type);
        $this->assertSame($log->id, $completion->actionable_id);
    }

    public function test_uncompleting_a_habit_removes_the_record_it_created(): void
    {
        $water = DrinkType::create(['name' => 'Agua', 'hydration_factor' => 1]);
        $habit = $this->habitWithAction('Vaso de agua', 'water.log_intake', HabitAction::MODE_AUTO, [
            'drink_type_id' => $water->id,
            'amount_ml' => 250,
        ]);
        $gamification = app(HabitGamificationService::class);

        $gamification->toggle($habit->id, '2026-07-13');
        $this->assertSame(1, DrinkLog::count());

        $feedback = $gamification->toggle($habit->id, '2026-07-13');

        $this->assertSame(0, DrinkLog::count());
        $this->assertNotNull($feedback['actionResult']);
        $this->assertNull(HabitCompletion::sole()->actionable_type);
    }

    public function test_a_habit_without_an_action_behaves_exactly_as_before(): void
    {
        $habit = HabitDefinition::create(['name' => 'Estirar', 'time_of_day' => 'morning']);

        $feedback = app(HabitGamificationService::class)->toggle($habit->id, '2026-07-13');

        $this->assertFalse($feedback['requiresInput']);
        $this->assertSame([], $feedback['promptFields']);
        $this->assertNull($feedback['actionResult']);
        $this->assertTrue(HabitCompletion::sole()->completed);
    }

    public function test_a_failing_action_still_leaves_the_habit_completed(): void
    {
        // La bebida configurada ya no existe: la acción revienta, el hábito no.
        $habit = $this->habitWithAction('Vaso de agua', 'water.log_intake', HabitAction::MODE_AUTO, [
            'drink_type_id' => 'no-existe',
            'amount_ml' => 250,
        ]);

        $feedback = app(HabitGamificationService::class)->toggle($habit->id, '2026-07-13');

        $this->assertTrue(HabitCompletion::sole()->completed);
        $this->assertSame(0, DrinkLog::count());
        $this->assertStringContainsString('no pude crear el registro', $feedback['actionResult']);
    }

    private function habitWithAction(string $name, string $key, string $mode, array $config): HabitDefinition
    {
        $habit = HabitDefinition::create(['name' => $name, 'time_of_day' => 'morning']);

        HabitAction::create([
            'habit_id' => $habit->id,
            'action_key' => $key,
            'mode' => $mode,
            'config' => $config,
        ]);

        return $habit->fresh();
    }
}
