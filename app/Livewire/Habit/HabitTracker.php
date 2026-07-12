<?php

namespace App\Livewire\Habit;

use App\Models\HabitCompletion;
use App\Models\HabitDefinition;
use Carbon\Carbon;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Hábitos')]
class HabitTracker extends Component
{
    public string $selectedDate;

    public function mount()
    {
        $this->selectedDate = now()->toDateString();
    }

    public function toggleHabit(int $habitId)
    {
        $completion = HabitCompletion::where('habit_id', $habitId)
            ->where('date', $this->selectedDate)
            ->first();

        if ($completion) {
            $completion->update(['completed' => !$completion->completed]);
        } else {
            HabitCompletion::create([
                'habit_id' => $habitId,
                'date' => $this->selectedDate,
                'completed' => true,
            ]);
        }
    }

    public function previousDay()
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->subDay()->toDateString();
    }

    public function nextDay()
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->addDay()->toDateString();
    }

    public function today()
    {
        $this->selectedDate = now()->toDateString();
    }

    public function render()
    {
        $habits = HabitDefinition::orderBy('base_time')->get();
        $completions = HabitCompletion::where('date', $this->selectedDate)
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
        ]);
    }
}
