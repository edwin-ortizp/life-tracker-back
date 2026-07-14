<?php

namespace App\Livewire\Goal;

use App\Models\Goal;
use App\Models\GoalEntry;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;

#[Layout('layouts.app')]
#[Title('Objetivos')]
class GoalIndex extends Component
{
    #[Url(as: 'status', history: true, keep: true)]
    public string $statusFilter = 'active'; // active, completed, abandoned, all
    public bool $showForm = false;
    public ?string $editingId = null;

    // Form fields
    public string $title = '';
    public string $description = '';
    public ?string $startDate = null;
    public ?string $dueDate = null;

    public function mount(): void
    {
        $this->normalizeStatusFilter();
    }

    public function updatedStatusFilter(): void
    {
        $this->normalizeStatusFilter();
    }

    public function openForm(?string $id = null)
    {
        $this->resetForm();

        if ($id) {
            $goal = Goal::find($id);
            if ($goal) {
                $this->editingId = $id;
                $this->title = $goal->title;
                $this->description = $goal->description ?? '';
                $this->startDate = $goal->start_date?->format('Y-m-d');
                $this->dueDate = $goal->due_date?->format('Y-m-d');
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
            'start_date' => $this->startDate ?: null,
            'due_date' => $this->dueDate ?: null,
        ];

        if ($this->editingId) {
            Goal::where('id', $this->editingId)->update($data);
        } else {
            $data['status'] = 'active';
            Goal::create($data);
        }

        $this->closeForm();
    }

    public function updateStatus(string $id, string $status)
    {
        Goal::where('id', $id)->update(['status' => $status]);
    }

    public function delete(string $id)
    {
        Goal::where('id', $id)->delete();
    }

    private function resetForm()
    {
        $this->title = '';
        $this->description = '';
        $this->startDate = null;
        $this->dueDate = null;
    }

    private function normalizeStatusFilter(): void
    {
        if (!in_array($this->statusFilter, ['active', 'completed', 'abandoned', 'all'], true)) {
            $this->statusFilter = 'active';
        }
    }

    public function render()
    {
        $query = Goal::query();

        if ($this->statusFilter !== 'all') {
            $query->where('status', $this->statusFilter);
        }

        $goals = $query->orderByDesc('created_at')->get();
        $activeCount = Goal::where('status', 'active')->count();
        $completedCount = Goal::where('status', 'completed')->count();

        return view('livewire.goal.goal-index', [
            'goals' => $goals,
            'activeCount' => $activeCount,
            'completedCount' => $completedCount,
        ]);
    }
}
