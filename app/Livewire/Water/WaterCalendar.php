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
#[Title('Calendario de hidratación')]
class WaterCalendar extends Component
{
    use HasUrlDate;

    public function mount(): void { $this->initializeSelectedDate(); }
    public function previousMonth(): void { $this->selectedDate = Carbon::parse($this->selectedDate)->subMonthNoOverflow()->startOfMonth()->toDateString(); }
    public function nextMonth(): void { $this->selectedDate = Carbon::parse($this->selectedDate)->addMonthNoOverflow()->startOfMonth()->toDateString(); }
    public function today(): void { $this->selectedDate = now()->toDateString(); }

    public function render()
    {
        $goal = WaterGoal::forUser(auth()->user());

        return view('livewire.water.water-calendar', [
            'goal' => $goal,
            'monthData' => WaterProgress::month(Carbon::parse($this->selectedDate), $goal),
        ]);
    }
}
