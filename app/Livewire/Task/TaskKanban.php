<?php

namespace App\Livewire\Task;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Kanban')]
class TaskKanban extends Component
{
    public function render()
    {
        return view('livewire.task.task-kanban');
    }
}
