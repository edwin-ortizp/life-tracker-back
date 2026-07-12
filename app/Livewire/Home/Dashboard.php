<?php

namespace App\Livewire\Home;

use App\Models\DrinkLog;
use App\Models\EnergyEntry;
use App\Models\HabitCompletion;
use App\Models\HabitDefinition;
use App\Models\MoodEntry;
use App\Models\Task;
use Carbon\Carbon;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Inicio')]
class Dashboard extends Component
{
    public string $selectedDate;

    public function mount()
    {
        $this->selectedDate = now()->toDateString();
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
        $date = $this->selectedDate;

        // Water stats
        $waterTotal = DrinkLog::where('date', $date)->sum('hydration_value');
        $waterGoal = 2500;

        // Mood
        $lastMood = MoodEntry::where('date', $date)->latest('timestamp')->first();

        // Energy
        $lastEnergy = EnergyEntry::where('date', $date)->latest('timestamp')->first();

        // Habits
        $totalHabits = HabitDefinition::count();
        $completedHabits = HabitCompletion::where('date', $date)
            ->where('completed', true)->count();

        // Tasks
        $pendingTasks = Task::where('completed', false)->count();
        $completedTasks = Task::where('completed', true)
            ->whereDate('updated_at', $date)->count();

        return view('livewire.home.dashboard', [
            'waterTotal' => $waterTotal,
            'waterGoal' => $waterGoal,
            'lastMood' => $lastMood,
            'lastEnergy' => $lastEnergy,
            'totalHabits' => $totalHabits,
            'completedHabits' => $completedHabits,
            'pendingTasks' => $pendingTasks,
            'completedTasks' => $completedTasks,
        ]);
    }
}
