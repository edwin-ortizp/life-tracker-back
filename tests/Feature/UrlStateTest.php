<?php

namespace Tests\Feature;

use App\Livewire\Exercise\ExerciseDaily;
use App\Livewire\Goal\GoalIndex;
use App\Livewire\Habit\HabitTracker;
use App\Livewire\Home\Dashboard;
use App\Livewire\Journal\JournalEntries;
use App\Livewire\Meal\MealWeekly;
use App\Livewire\Mood\MoodTracker;
use App\Livewire\NegativeHabit\NegativeHabitWeekly;
use App\Livewire\Relationship\RelationshipIndex;
use App\Livewire\Statistics\StatisticsDashboard;
use App\Livewire\Task\TaskList;
use App\Livewire\Water\WaterDaily;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class UrlStateTest extends TestCase
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

    public static function dateComponents(): array
    {
        return [
            'dashboard' => [Dashboard::class],
            'water' => [WaterDaily::class],
            'exercise' => [ExerciseDaily::class],
            'habits' => [HabitTracker::class],
            'mood' => [MoodTracker::class],
            'journal' => [JournalEntries::class],
            'meals' => [MealWeekly::class],
            'negative habits' => [NegativeHabitWeekly::class],
        ];
    }

    #[DataProvider('dateComponents')]
    public function test_date_query_parameter_hydrates_each_date_based_module(string $component): void
    {
        Livewire::withQueryParams(['date' => '2026-12-20'])
            ->test($component)
            ->assertSet('selectedDate', '2026-12-20');
    }

    #[DataProvider('dateComponents')]
    public function test_missing_or_invalid_date_falls_back_to_today(string $component): void
    {
        Livewire::withQueryParams(['date' => '2026-02-30'])
            ->test($component)
            ->assertSet('selectedDate', '2026-07-12');

        Livewire::withQueryParams([])
            ->test($component)
            ->assertSet('selectedDate', '2026-07-12');
    }

    public function test_task_filters_hydrate_from_the_url_and_invalid_values_reset(): void
    {
        Livewire::withQueryParams([
            'status' => 'completed',
            'category' => 'salud',
            'priority' => 'urgent-important',
        ])->test(TaskList::class)
            ->assertSet('filter', 'completed')
            ->assertSet('categoryFilter', 'salud')
            ->assertSet('priorityFilter', 'urgent-important');

        Livewire::withQueryParams([
            'status' => 'unknown',
            'category' => 'unknown',
            'priority' => 'unknown',
        ])->test(TaskList::class)
            ->assertSet('filter', 'pending')
            ->assertSet('categoryFilter', '')
            ->assertSet('priorityFilter', '');
    }

    public function test_goal_relationship_and_statistics_filters_are_normalized_from_the_url(): void
    {
        Livewire::withQueryParams(['status' => 'completed'])
            ->test(GoalIndex::class)
            ->assertSet('statusFilter', 'completed');

        Livewire::withQueryParams(['status' => 'unknown'])
            ->test(GoalIndex::class)
            ->assertSet('statusFilter', 'active');

        Livewire::withQueryParams(['archived' => 'true', 'circle' => 'missing-circle'])
            ->test(RelationshipIndex::class)
            ->assertSet('showArchived', true)
            ->assertSet('circleFilter', '');

        Livewire::withQueryParams(['days' => '14'])
            ->test(StatisticsDashboard::class)
            ->assertSet('days', 14);

        Livewire::withQueryParams(['days' => '365'])
            ->test(StatisticsDashboard::class)
            ->assertSet('days', 7);
    }
}
