<?php

namespace App\Livewire\Exercise;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Ejercicio')]
class ExerciseDaily extends Component
{
    public function render()
    {
        return view('livewire.exercise.exercise-daily');
    }
}
