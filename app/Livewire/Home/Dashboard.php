<?php

namespace App\Livewire\Home;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Inicio')]
class Dashboard extends Component
{
    public function render()
    {
        return view('livewire.home.dashboard');
    }
}
