<?php

namespace App\Livewire\Goal;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Objetivos')]
class GoalIndex extends Component
{
    public function render()
    {
        return view('livewire.goal.goal-index');
    }
}
