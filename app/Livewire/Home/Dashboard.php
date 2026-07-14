<?php

namespace App\Livewire\Home;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\DrinkLog;
use App\Models\EnergyEntry;
use App\Models\HabitCompletion;
use App\Models\HabitDefinition;
use App\Models\JournalEntry;
use App\Models\MoodEntry;
use App\Models\Task;
use App\Models\VehicleMaintenancePlan;
use App\Support\VehicleMaintenanceStatus;
use App\Support\WaterGoal;
use Carbon\Carbon;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Inicio')]
class Dashboard extends Component
{
    use HasUrlDate;

    public function mount()
    {
        $this->initializeSelectedDate();
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
        $waterGoal = WaterGoal::forUser(auth()->user());

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
        $journalEntry = JournalEntry::where('date', $date)->first();

        $vehicleAlerts = VehicleMaintenancePlan::where('active', true)
            ->with(['vehicle', 'template', 'maintenanceLogs'])
            ->get()
            ->map(function (VehicleMaintenancePlan $plan) {
                $plan->setAttribute('status_data', VehicleMaintenanceStatus::forPlan($plan));
                return $plan;
            })
            ->filter(fn (VehicleMaintenancePlan $plan) => $plan->status_data['status'] !== 'al_dia')
            ->sortBy(fn (VehicleMaintenancePlan $plan) => $plan->status_data['status'] === 'vencido' ? 0 : 1)
            ->take(3)
            ->values();

        return view('livewire.home.dashboard', [
            'waterTotal' => $waterTotal,
            'waterGoal' => $waterGoal,
            'lastMood' => $lastMood,
            'lastEnergy' => $lastEnergy,
            'totalHabits' => $totalHabits,
            'completedHabits' => $completedHabits,
            'pendingTasks' => $pendingTasks,
            'completedTasks' => $completedTasks,
            'journalEntry' => $journalEntry,
            'vehicleAlerts' => $vehicleAlerts,
        ]);
    }
}
