<?php

namespace App\Livewire\Statistics;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Estadísticas')]
class StatisticsDashboard extends Component
{
    public function render()
    {
        return view('livewire.statistics.statistics-dashboard');
    }
}
