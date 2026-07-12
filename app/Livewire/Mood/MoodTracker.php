<?php

namespace App\Livewire\Mood;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Estado de Ánimo')]
class MoodTracker extends Component
{
    public function render()
    {
        return view('livewire.mood.mood-tracker');
    }
}
