<?php

namespace App\Livewire\NegativeHabit;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Hábitos Negativos')]
class NegativeHabitWeekly extends Component
{
    public function render()
    {
        return view('livewire.negative-habit.negative-habit-weekly');
    }
}
