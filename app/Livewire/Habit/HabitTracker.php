<?php

namespace App\Livewire\Habit;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Hábitos')]
class HabitTracker extends Component
{
    public function render()
    {
        return view('livewire.habit.habit-tracker');
    }
}
