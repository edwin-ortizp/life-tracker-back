<?php

namespace App\Livewire\Water;

use App\Livewire\Concerns\HasUrlDate;
use App\Support\WaterGoal;
use App\Support\WaterProgress;
use Carbon\Carbon;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Tendencias de hidratación')]
class WaterRange extends Component
{
    use HasUrlDate;

    #[Url(as: 'period', history: true, keep: true)]
    public int $period = 30;

    public function mount(): void
    {
        $this->initializeSelectedDate();
        if (! in_array($this->period, [30, 90, 365], true)) $this->period = 30;
    }

    public function render()
    {
        $goal = WaterGoal::forUser(auth()->user());

        return view('livewire.water.water-range', [
            'goal' => $goal,
            'rangeData' => WaterProgress::range(Carbon::parse($this->selectedDate), $this->period, $goal),
        ]);
    }
}
