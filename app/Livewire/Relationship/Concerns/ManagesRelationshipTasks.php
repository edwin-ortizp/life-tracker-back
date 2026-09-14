<?php

namespace App\Livewire\Relationship\Concerns;

use App\Models\Task;
use App\Models\TaskAssociation;
use App\Services\TaskGamificationService;
use Illuminate\Support\Facades\DB;

/**
 * Tareas asociadas a una persona: crear, completar o reabrir y quitar el vínculo.
 * Las tareas siguen siendo del módulo Tareas; aquí solo se enlazan. Requiere ResolvesRelationship.
 */
trait ManagesRelationshipTasks
{
    public bool $showTaskForm = false;

    public string $taskTitle = '';

    public string $taskDescription = '';

    public string $taskPriority = '';

    public ?string $taskDueDate = null;

    public bool $taskIsPrivate = false;

    public array $priorities = [
        'urgent-important' => 'Urgente e importante',
        'not-urgent-important' => 'No urgente, importante',
        'urgent-not-important' => 'Urgente, no importante',
        'not-urgent-not-important' => 'No urgente, no importante',
    ];

    public function openTaskForm(?string $suggestedTitle = null, ?string $dueDate = null): void
    {
        $this->resetTaskForm();
        $this->taskTitle = $suggestedTitle ?? '';
        $this->taskDueDate = $dueDate;
        $this->showTaskForm = true;
    }

    public function saveTask(): void
    {
        $validated = $this->validate([
            'taskTitle' => ['required', 'string', 'max:255'],
            'taskDescription' => ['nullable', 'string', 'max:5000'],
            'taskPriority' => ['nullable', 'in:'.implode(',', array_keys($this->priorities))],
            'taskDueDate' => ['nullable', 'date'],
            'taskIsPrivate' => ['boolean'],
        ]);

        DB::transaction(function () use ($validated): void {
            $task = Task::create([
                'task_code' => random_int(10000, 99999),
                'title' => trim($validated['taskTitle']),
                'description' => trim($validated['taskDescription']) ?: null,
                'category' => 'social',
                'priority' => $validated['taskPriority'] ?: null,
                'end_date' => $validated['taskDueDate'] ?: null,
                'is_private' => $validated['taskIsPrivate'],
            ]);

            TaskAssociation::link($task, $this->relationship());
        });

        $this->showTaskForm = false;
        $this->resetTaskForm();
    }

    /** Completa o reabre una tarea vinculada. Las recurrentes se gestionan en Tareas. */
    public function toggleTask(string $id, TaskGamificationService $gamification): void
    {
        $task = $this->relationshipTask($id);

        if ($task->is_recurrent && ! $task->completed) {
            return;
        }

        $result = $gamification->toggle($task);

        if ($result['completed']) {
            $this->dispatch('task-completed', ...$result);
        }
    }

    /** Quita solo el vínculo: la tarea sigue en el módulo Tareas. */
    public function unlinkTask(string $id): void
    {
        TaskAssociation::unlink($this->relationshipTask($id), $this->relationship());
    }

    protected function relationshipTask(string $id): Task
    {
        return $this->relationship()->tasks()->where('tasks.id', $id)->firstOrFail();
    }

    protected function resetTaskForm(): void
    {
        $this->taskTitle = '';
        $this->taskDescription = '';
        $this->taskPriority = '';
        $this->taskDueDate = null;
        $this->taskIsPrivate = false;
        $this->resetValidation();
    }
}
