<?php

namespace App\Livewire\Habit;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\HabitCompletion;
use App\Models\HabitDefinition;
use App\Models\ModuleSetting;
use App\Support\HabitInsights;
use App\Support\HabitProgress;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Resumen semanal de hábitos')]
class HabitWeekly extends Component
{
    use HasUrlDate;

    public int $weeklyGoal = 80;

    public function mount(): void
    {
        $this->initializeSelectedDate();

        if (! auth()->check()) {
            return;
        }

        $setting = ModuleSetting::firstOrCreate(
            ['module' => 'habits'],
            ['settings' => ['weekly_goal_percent' => 80]],
        );

        $this->weeklyGoal = (int) ($setting->settings['weekly_goal_percent'] ?? 80);
    }

    public function previousWeek(): void
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->subWeek()->toDateString();
    }

    public function nextWeek(): void
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->addWeek()->toDateString();
    }

    public function thisWeek(): void
    {
        $this->selectedDate = now()->toDateString();
    }

    public function saveWeeklyGoal(): void
    {
        $this->validate([
            'weeklyGoal' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $setting = ModuleSetting::firstOrCreate(['module' => 'habits']);
        $setting->update([
            'settings' => array_merge($setting->settings ?? [], [
                'weekly_goal_percent' => $this->weeklyGoal,
            ]),
        ]);
    }

    public function render(HabitInsights $insightCalculator)
    {
        $today = now()->startOfDay();
        $weekStart = Carbon::parse($this->selectedDate)->startOfWeek(Carbon::MONDAY);
        $weekDates = collect(range(0, 6))->map(
            fn (int $offset) => $weekStart->copy()->addDays($offset),
        );
        $weekEnd = $weekDates->last()->copy()->endOfDay();
        $trackedDateKeys = $weekDates
            ->filter(fn (Carbon $date) => $date->lte($today))
            ->map(fn (Carbon $date) => $date->toDateString())
            ->values();

        $habits = HabitDefinition::orderBy('base_time')->get();
        $habitIds = $habits->pluck('id');
        $weekCompletionMap = HabitCompletion::query()
            ->whereIn('habit_id', $habitIds)
            ->where('completed', true)
            ->whereDate('date', '>=', $weekStart->toDateString())
            ->whereDate('date', '<=', $weekEnd->toDateString())
            ->get(['habit_id', 'date'])
            ->groupBy('habit_id')
            ->map(fn (Collection $entries) => $entries
                ->mapWithKeys(fn (HabitCompletion $completion) => [$completion->date->toDateString() => true])
                ->all())
            ->all();

        $completionHistory = HabitCompletion::query()
            ->whereIn('habit_id', $habitIds)
            ->where('completed', true)
            ->whereDate('date', '<=', $today->toDateString())
            ->get(['habit_id', 'date'])
            ->groupBy('habit_id')
            ->map(fn (Collection $entries) => $entries
                ->mapWithKeys(fn (HabitCompletion $completion) => [$completion->date->toDateString() => true])
                ->all())
            ->all();

        $habitRows = $habits->map(function (HabitDefinition $habit) use ($weekDates, $weekCompletionMap, $completionHistory, $trackedDateKeys, $today) {
            $completedDates = $weekCompletionMap[$habit->id] ?? [];
            $completedCount = count($completedDates);
            $trackedDayCount = $trackedDateKeys->count();

            return [
                'id' => $habit->id,
                'name' => $habit->name,
                'icon' => $habit->icon,
                'time_of_day' => $habit->time_of_day,
                'days' => $weekDates->map(fn (Carbon $date) => [
                    'date' => $date->toDateString(),
                    'completed' => isset($completedDates[$date->toDateString()]),
                    'tracked' => $date->lte($today),
                ])->all(),
                'completed_count' => $completedCount,
                'percentage' => $trackedDayCount > 0 ? (int) round(($completedCount / $trackedDayCount) * 100) : null,
                'streak' => HabitProgress::currentStreak($completionHistory[$habit->id] ?? [], $today),
            ];
        });

        $trackedDayCount = $trackedDateKeys->count();
        $completedCount = $habitRows->sum('completed_count');
        $possibleCount = $habits->count() * $trackedDayCount;
        $completionPercentage = $possibleCount > 0
            ? (int) round(($completedCount / $possibleCount) * 100)
            : null;
        $weekState = $trackedDayCount === 0
            ? 'future'
            : ($completionPercentage >= $this->weeklyGoal ? 'achieved' : 'in_progress');
        $insights = $insightCalculator->weekly($habits, $trackedDateKeys, $weekCompletionMap);

        return view('livewire.habit.habit-weekly', [
            'weekStart' => $weekStart,
            'weekDates' => $weekDates,
            'habitRows' => $habitRows,
            'trackedDayCount' => $trackedDayCount,
            'completedCount' => $completedCount,
            'possibleCount' => $possibleCount,
            'completionPercentage' => $completionPercentage,
            'bestStreak' => $habitRows->max('streak') ?? 0,
            'weekState' => $weekState,
            'insights' => $insights,
        ]);
    }
}
