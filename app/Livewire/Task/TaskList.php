<?php

namespace App\Livewire\Task;

use App\Models\Task;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Tareas')]
class TaskList extends Component
{
    public string $filter = 'pending'; // pending, completed, all
    public string $categoryFilter = '';
    public string $priorityFilter = '';

    // Form
    public bool $showForm = false;
    public ?string $editingId = null;
    public string $title = '';
    public string $description = '';
    public string $category = '';
    public string $priority = '';
    public string $size = '';
    public ?string $startDate = null;
    public ?string $endDate = null;
    public bool $isPrivate = false;

    public array $categories = [
        'trabajo' => 'Trabajo',
        'personal' => 'Personal',
        'salud' => 'Salud',
        'finanzas' => 'Finanzas',
        'educacion' => 'Educación',
        'hogar' => 'Hogar',
        'social' => 'Social',
        'creatividad' => 'Creatividad',
        'tecnologia' => 'Tecnología',
        'compras' => 'Compras',
        'tramites' => 'Trámites',
        'otros' => 'Otros',
    ];

    public array $priorities = [
        'urgent-important' => '🔴 Urgente e Importante',
        'not-urgent-important' => '🟡 No Urgente pero Importante',
        'urgent-not-important' => '🟠 Urgente No Importante',
        'not-urgent-not-important' => '⚪ No Urgente No Importante',
    ];

    public array $sizes = [
        'XS' => 'XS (< 30 min)',
        'S' => 'S (30 min - 1h)',
        'M' => 'M (1-2h)',
        'L' => 'L (2-4h)',
        'XL' => 'XL (> 4h)',
    ];

    public function openForm(?string $id = null)
    {
        $this->resetForm();

        if ($id) {
            $task = Task::find($id);
            if ($task) {
                $this->editingId = $id;
                $this->title = $task->title;
                $this->description = $task->description ?? '';
                $this->category = $task->category ?? '';
                $this->priority = $task->priority ?? '';
                $this->size = $task->size ?? '';
                $this->startDate = $task->start_date?->format('Y-m-d');
                $this->endDate = $task->end_date?->format('Y-m-d');
                $this->isPrivate = $task->is_private;
            }
        }

        $this->showForm = true;
    }

    public function closeForm()
    {
        $this->showForm = false;
        $this->editingId = null;
        $this->resetForm();
    }

    public function save()
    {
        if (empty(trim($this->title))) return;

        $data = [
            'title' => trim($this->title),
            'description' => $this->description ?: null,
            'category' => $this->category ?: null,
            'priority' => $this->priority ?: null,
            'size' => $this->size ?: null,
            'start_date' => $this->startDate ?: null,
            'end_date' => $this->endDate ?: null,
            'is_private' => $this->isPrivate,
        ];

        if ($this->editingId) {
            $task = Task::find($this->editingId);
            if ($task) {
                $task->update($data);
            }
        } else {
            $data['task_code'] = rand(10000, 99999);
            Task::create($data);
        }

        $this->closeForm();
    }

    public function toggleComplete(string $id)
    {
        $task = Task::find($id);
        if ($task) {
            $task->update(['completed' => !$task->completed]);
        }
    }

    public function delete(string $id)
    {
        Task::where('id', $id)->delete();
    }

    private function resetForm()
    {
        $this->title = '';
        $this->description = '';
        $this->category = '';
        $this->priority = '';
        $this->size = '';
        $this->startDate = null;
        $this->endDate = null;
        $this->isPrivate = false;
    }

    public function render()
    {
        $query = Task::query();

        if ($this->filter === 'pending') {
            $query->where('completed', false);
        } elseif ($this->filter === 'completed') {
            $query->where('completed', true);
        }

        if ($this->categoryFilter) {
            $query->where('category', $this->categoryFilter);
        }

        if ($this->priorityFilter) {
            $query->where('priority', $this->priorityFilter);
        }

        $tasks = $query->orderByRaw('CASE WHEN priority = "urgent-important" THEN 1 WHEN priority = "not-urgent-important" THEN 2 WHEN priority = "urgent-not-important" THEN 3 ELSE 4 END')
            ->orderByDesc('created_at')
            ->get();

        $pendingCount = Task::where('completed', false)->count();
        $completedCount = Task::where('completed', true)->count();

        return view('livewire.task.task-list', [
            'tasks' => $tasks,
            'pendingCount' => $pendingCount,
            'completedCount' => $completedCount,
        ]);
    }
}
