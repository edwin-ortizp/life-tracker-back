<?php

namespace App\Livewire\Meal;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Comidas')]
class MealWeekly extends Component
{
    public function render()
    {
        return view('livewire.meal.meal-weekly');
    }
}
