<?php

namespace App\Livewire\Task;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Tareas')]
class TaskList extends Component
{
    public function render()
    {
        return view('livewire.task.task-list');
    }
}
