<?php

namespace Tests\Feature;

use App\Livewire\Exercise\ExerciseDaily;
use App\Livewire\Exercise\ExerciseSettings;
use App\Models\ExerciseLog;
use App\Models\ExerciseType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class ExerciseDailyProgressTest extends TestCase
{
    use RefreshDatabase;

    private ?ExerciseType $type = null;

    public function test_progress_and_calendar_live_in_the_rail(): void
    {
        $this->actingAs(User::factory()->create(['daily_exercise_minutes' => 30]));
        $this->activity(now()->toDateString(), 20);

        $this->get('/exercise')->assertOk()->assertSee('md-module-workspace--rail', false);

        Livewire::test(ExerciseDaily::class)
            ->assertDontSee('Resumen del día')
            ->assertSee('Objetivo de hoy')
            ->assertSeeHtml('<strong>20 min <span>/ 30 min</span></strong>')
            ->assertSee('67 %')
            ->assertSee('Faltan 10 min para alcanzar tu meta diaria.')
            ->assertSee('Calendario del mes');
    }

    public function test_goal_supports_values_over_one_hundred_percent(): void
    {
        $this->actingAs(User::factory()->create(['daily_exercise_minutes' => 30]));
        $this->activity(now()->toDateString(), 45);

        Livewire::test(ExerciseDaily::class)
            ->assertViewHas('rawPercentage', 150)
            ->assertSee('150 %')
            ->assertSee('Superaste tu meta por 15 min.');
    }

    public function test_streak_counts_only_consecutive_days_meeting_the_goal(): void
    {
        $this->actingAs(User::factory()->create(['daily_exercise_minutes' => 30]));
        $this->activity(now()->subDays(3)->toDateString(), 10);
        $this->activity(now()->subDays(2)->toDateString(), 30);
        $this->activity(now()->subDay()->toDateString(), 40);
        $this->activity(now()->toDateString(), 5);

        Livewire::test(ExerciseDaily::class)
            ->assertViewHas('streak', 2)
            ->assertSee('Racha actual: 2 días cumpliendo tu meta de actividad.');
    }

    public function test_calendar_navigates_months(): void
    {
        $this->actingAs(User::factory()->create());

        Livewire::test(ExerciseDaily::class, ['date' => '2026-09-10'])
            ->assertSet('calendarMonth', '2026-09')
            ->call('previousMonth')
            ->assertSet('calendarMonth', '2026-08')
            ->assertViewHas('monthData', fn ($month) => $month['weeks']->flatten(1)->firstWhere('in_month', true)['date']->month === 8);
    }

    public function test_settings_update_the_daily_active_minutes_goal(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get('/exercise/settings')->assertOk()->assertSee('md-module-workspace--rail', false)->assertSee('Meta diaria');

        Livewire::test(ExerciseSettings::class)
            ->assertSet('dailyExerciseMinutes', 30)
            ->set('dailyExerciseMinutes', 45)
            ->call('saveGoal')
            ->assertHasNoErrors()
            ->assertSee('Meta diaria actualizada.')
            ->set('dailyExerciseMinutes', 2)
            ->call('saveGoal')
            ->assertHasErrors(['dailyExerciseMinutes' => 'between']);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'daily_exercise_minutes' => 45]);
    }

    private function activity(string $date, int $minutes): void
    {
        $this->type ??= ExerciseType::create(['name' => 'Caminar', 'calories_per_hour' => 250, 'icon' => '🚶']);

        ExerciseLog::create(['date' => $date, 'exercise_type_id' => $this->type->id, 'duration' => $minutes]);
    }
}
