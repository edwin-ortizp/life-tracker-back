<?php

namespace App\Livewire\Habit;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\HabitCompletion;
use App\Models\HabitDefinition;
use App\Services\HabitGamificationService;
use App\Support\HabitProgress;
use Carbon\Carbon;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Hábitos')]
class HabitTracker extends Component
{
    use HasUrlDate;

    public ?array $lastHabitFeedback = null;

    public function mount()
    {
        $this->initializeSelectedDate();
    }

    public function toggleHabit(int $habitId, HabitGamificationService $gamification): void
    {
        $this->lastHabitFeedback = $gamification->toggle($habitId, $this->selectedDate);
        $this->dispatch('habit-feedback', ...$this->lastHabitFeedback);
    }

    public function previousDay()
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->subDay()->toDateString();
        $this->lastHabitFeedback = null;
    }

    public function nextDay()
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->addDay()->toDateString();
        $this->lastHabitFeedback = null;
    }

    public function today()
    {
        $this->selectedDate = now()->toDateString();
        $this->lastHabitFeedback = null;
    }

    public function render(HabitGamificationService $gamification)
    {
        $habits = HabitDefinition::orderBy('base_time')->get();
        $completions = HabitCompletion::whereDate('date', $this->selectedDate)
            ->pluck('completed', 'habit_id')
            ->toArray();

        $groupedHabits = $habits->groupBy('time_of_day');
        $completedCount = count(array_filter($completions));
        $totalCount = $habits->count();

        return view('livewire.habit.habit-tracker', [
            'groupedHabits' => $groupedHabits,
            'completions' => $completions,
            'completedCount' => $completedCount,
            'totalCount' => $totalCount,
            'monthData' => HabitProgress::month(Carbon::parse($this->selectedDate)),
            'initiallyOpenTimeOfDay' => $this->initiallyOpenTimeOfDay(),
            'coachCard' => $gamification->coachCard(
                Carbon::parse($this->selectedDate),
                $habits,
                $completions,
                $this->lastHabitFeedback,
            ),
        ]);
    }

    private function initiallyOpenTimeOfDay(): array
    {
        $now = Carbon::now(config('app.timezone'));

        if ($this->selectedDate !== $now->toDateString()) {
            return ['morning', 'afternoon', 'night', 'anytime'];
        }

        if ($now->hour >= 6 && $now->hour < 12) {
            return ['morning', 'anytime'];
        }

        if ($now->hour >= 12 && $now->hour < 18) {
            return ['afternoon', 'anytime'];
        }

        return ['night', 'anytime'];
    }
}
