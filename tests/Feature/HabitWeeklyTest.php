<?php

namespace Tests\Feature;

use App\Livewire\Habit\HabitTracker;
use App\Livewire\Habit\HabitWeekly;
use App\Models\HabitCompletion;
use App\Models\HabitDefinition;
use App\Models\ModuleSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class HabitWeeklyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-07-12 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_weekly_dashboard_uses_monday_to_sunday_and_calculates_progress_and_streaks(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $exercise = HabitDefinition::create(['name' => 'Ejercicio', 'time_of_day' => 'morning']);
        $reading = HabitDefinition::create(['name' => 'Lectura', 'time_of_day' => 'night']);

        foreach (['2026-07-06', '2026-07-10', '2026-07-11', '2026-07-12'] as $date) {
            HabitCompletion::create(['habit_id' => $exercise->id, 'date' => $date, 'completed' => true]);
        }
        foreach (['2026-07-06', '2026-07-07'] as $date) {
            HabitCompletion::create(['habit_id' => $reading->id, 'date' => $date, 'completed' => true]);
        }

        $this->assertDatabaseCount('habit_completions', 6);

        Livewire::withQueryParams(['date' => '2026-07-08'])
            ->test(HabitWeekly::class)
            ->assertSet('selectedDate', '2026-07-08')
            ->assertViewHas('weekStart', fn ($weekStart) => $weekStart->toDateString() === '2026-07-06')
            ->assertViewHas('trackedDayCount', 7)
            ->assertViewHas('completedCount', 6)
            ->assertViewHas('possibleCount', 14)
            ->assertViewHas('completionPercentage', 43)
            ->assertViewHas('bestStreak', 3)
            ->assertViewHas('habitRows', function ($rows) use ($exercise) {
                return $rows->firstWhere('id', $exercise->id)['streak'] === 3;
            });
    }

    public function test_future_weeks_are_visible_without_progress_or_goal_evaluation(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        HabitDefinition::create(['name' => 'Ejercicio', 'time_of_day' => 'morning']);

        Livewire::withQueryParams(['date' => '2026-07-20'])
            ->test(HabitWeekly::class)
            ->assertViewHas('trackedDayCount', 0)
            ->assertViewHas('possibleCount', 0)
            ->assertViewHas('completionPercentage', null)
            ->assertViewHas('weekState', 'future');
    }

    public function test_weekly_goal_is_persisted_per_user_and_other_users_habits_are_hidden(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $this->actingAs($user);
        HabitDefinition::create(['name' => 'Propio', 'time_of_day' => 'morning']);
        HabitDefinition::withoutGlobalScopes()->forceCreate([
            'user_id' => $otherUser->id,
            'name' => 'Ajeno',
            'time_of_day' => 'morning',
        ]);

        Livewire::test(HabitWeekly::class)
            ->set('weeklyGoal', 75)
            ->call('saveWeeklyGoal')
            ->assertHasNoErrors()
            ->assertViewHas('habitRows', fn ($rows) => $rows->count() === 1 && $rows->first()['name'] === 'Propio');

        $this->assertSame(75, ModuleSetting::where('module', 'habits')->firstOrFail()->settings['weekly_goal_percent']);
        $this->assertDatabaseMissing('module_settings', [
            'user_id' => $otherUser->id,
            'module' => 'habits',
        ]);
    }

    public function test_daily_context_builds_month_percentages_and_current_streaks_per_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $this->actingAs($user);
        $exercise = HabitDefinition::create(['name' => 'Ejercicio', 'time_of_day' => 'morning']);
        HabitDefinition::create(['name' => 'Lectura', 'time_of_day' => 'night']);

        foreach (['2026-07-11', '2026-07-12'] as $date) {
            HabitCompletion::create(['habit_id' => $exercise->id, 'date' => $date, 'completed' => true]);
        }

        $otherHabit = HabitDefinition::withoutGlobalScopes()->forceCreate([
            'user_id' => $otherUser->id,
            'name' => 'Ajeno',
            'time_of_day' => 'morning',
        ]);
        HabitCompletion::withoutGlobalScopes()->forceCreate([
            'user_id' => $otherUser->id,
            'habit_id' => $otherHabit->id,
            'date' => '2026-07-12',
            'completed' => true,
        ]);

        Livewire::withQueryParams(['date' => '2026-07-12'])
            ->test(HabitTracker::class)
            ->assertViewHas('monthData', function (array $monthData) {
                $selected = $monthData['weeks']->flatten(1)->firstWhere('selected', true);

                return $monthData['habit_count'] === 2
                    && $monthData['best_streak'] === 2
                    && $selected['completed'] === 1
                    && $selected['percentage'] === 50;
            });
    }
}
