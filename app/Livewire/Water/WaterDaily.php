<?php

namespace App\Livewire\Water;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Hidratación')]
class WaterDaily extends Component
{
    public function render()
    {
        return view('livewire.water.water-daily');
    }
}
