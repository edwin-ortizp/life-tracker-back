<?php

namespace App\Livewire\Water;

use App\Livewire\Concerns\HasUrlDate;
use App\Support\WaterGoal;
use App\Support\WaterProgress;
use Carbon\Carbon;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Hidratación semanal')]
class WaterWeekly extends Component
{
    use HasUrlDate;

    public function mount(): void { $this->initializeSelectedDate(); }
    public function previousWeek(): void { $this->selectedDate = Carbon::parse($this->selectedDate)->subWeek()->toDateString(); }
    public function nextWeek(): void { $this->selectedDate = Carbon::parse($this->selectedDate)->addWeek()->toDateString(); }
    public function today(): void { $this->selectedDate = now()->toDateString(); }

    public function render()
    {
        $goal = WaterGoal::forUser(auth()->user());

        return view('livewire.water.water-weekly', [
            'goal' => $goal,
            'weekData' => WaterProgress::week(Carbon::parse($this->selectedDate), $goal),
        ]);
    }
}
