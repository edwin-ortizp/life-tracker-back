<?php

namespace App\Livewire\Task;

use App\Models\Task;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Kanban')]
class TaskKanban extends Component
{
    public function toggleComplete(string $id)
    {
        $task = Task::find($id);
        if ($task) {
            $task->update(['completed' => !$task->completed]);
        }
    }

    public function render()
    {
        $tasks = Task::orderByDesc('created_at')->get();

        $columns = [
            'urgent-important' => ['label' => 'Urgente + Importante', 'color' => 'danger', 'tasks' => collect()],
            'not-urgent-important' => ['label' => 'No Urgente + Importante', 'color' => 'warning', 'tasks' => collect()],
            'urgent-not-important' => ['label' => 'Urgente + No Importante', 'color' => 'info', 'tasks' => collect()],
            'not-urgent-not-important' => ['label' => 'No Urgente + No Importante', 'color' => 'secondary', 'tasks' => collect()],
        ];

        foreach ($tasks as $task) {
            $priority = $task->priority ?? 'not-urgent-not-important';
            if (isset($columns[$priority])) {
                $columns[$priority]['tasks']->push($task);
            } else {
                $columns['not-urgent-not-important']['tasks']->push($task);
            }
        }

        return view('livewire.task.task-kanban', [
            'columns' => $columns,
        ]);
    }
}
