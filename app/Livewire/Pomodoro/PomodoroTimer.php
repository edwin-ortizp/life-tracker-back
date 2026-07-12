<?php

namespace App\Livewire\Pomodoro;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Pomodoro')]
class PomodoroTimer extends Component
{
    public function render()
    {
        return view('livewire.pomodoro.pomodoro-timer');
    }
}
