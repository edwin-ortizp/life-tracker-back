<?php

namespace App\Livewire\Task;

use App\Livewire\Concerns\HandlesRecurringTaskCompletion;
use App\Models\Task;
use App\Services\TaskGamificationService;
use Illuminate\Support\Facades\DB;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Tareas')]
class TaskList extends Component
{
    use HandlesRecurringTaskCompletion;

    #[Url(as: 'status', history: true, keep: true)]
    public string $filter = 'pending'; // pending, completed, all

    #[Url(as: 'category', history: true, keep: true)]
    public string $categoryFilter = '';

    #[Url(as: 'priority', history: true, keep: true)]
    public string $priorityFilter = '';

    #[Url(as: 'edit')]
    public ?string $editTask = null;

    // Form
    public bool $showForm = false;

    public bool $showBulkForm = false;

    public string $descriptionMode = 'write';

    public string $bulkDescriptionMode = 'write';

    public ?string $editingId = null;

    public string $title = '';

    public string $description = '';

    public string $category = '';

    public string $priority = '';

    public string $size = '';

    public ?string $startDate = null;

    public ?string $endDate = null;

    public bool $isPrivate = false;

    public bool $isRecurrent = false;

    public int $recurrenceIntervalDays = 7;

    // Bulk form: every non-empty line becomes one task with these shared fields.
    public string $bulkTitles = '';

    public string $bulkDescription = '';

    public string $bulkCategory = '';

    public string $bulkPriority = '';

    public string $bulkSize = '';

    public ?string $bulkStartDate = null;

    public ?string $bulkEndDate = null;

    public bool $bulkIsPrivate = false;

    public array $categories = [
        'jikko' => 'Jikko',
        'entreagiles' => 'EntreAgiles',
        'gesthor' => 'Gesthor',
        'certmind' => 'CertMind',
        'unicauca' => 'Unicauca',
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

    public function mount(): void
    {
        $this->normalizeFilters();

        if ($this->editTask) {
            $this->openForm($this->editTask);
        }
    }

    public function updatedFilter(): void
    {
        $this->normalizeFilters();
    }

    public function updatedCategoryFilter(): void
    {
        $this->normalizeFilters();
    }

    public function updatedPriorityFilter(): void
    {
        $this->normalizeFilters();
    }

    public function openForm(?string $id = null)
    {
        $this->resetForm();
        $this->descriptionMode = 'write';

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
                $this->isRecurrent = $task->is_recurrent;
                $this->recurrenceIntervalDays = max(1, (int) (($task->recurrence ?? [])['customDays'] ?? 7));
            }
        }

        $this->showForm = true;
    }

    public function closeForm()
    {
        $this->showForm = false;
        $this->editingId = null;
        $this->editTask = null;
        $this->resetForm();
    }

    public function openBulkForm(): void
    {
        $this->resetBulkForm();
        $this->bulkDescriptionMode = 'write';
        $this->showBulkForm = true;
    }

    public function closeBulkForm(): void
    {
        $this->showBulkForm = false;
        $this->resetBulkForm();
        $this->resetValidation('bulkTitles');
    }

    public function saveBulk(): void
    {
        $titles = collect(preg_split('/\R/', $this->bulkTitles) ?: [])
            ->map(fn (string $title) => trim($title))
            ->filter()
            ->values();

        if ($titles->isEmpty()) {
            $this->addError('bulkTitles', 'Escribe al menos una tarea.');

            return;
        }

        $data = [
            'description' => $this->bulkDescription ?: null,
            'category' => $this->bulkCategory ?: null,
            'priority' => $this->bulkPriority ?: null,
            'size' => $this->bulkSize ?: null,
            'start_date' => $this->bulkStartDate ?: null,
            'end_date' => $this->bulkEndDate ?: null,
            'is_private' => $this->bulkIsPrivate,
        ];

        DB::transaction(function () use ($titles, $data) {
            foreach ($titles as $title) {
                Task::create([...$data, 'title' => $title, 'task_code' => rand(10000, 99999)]);
            }
        });

        $this->closeBulkForm();
    }

    public function save()
    {
        if (empty(trim($this->title))) {
            return;
        }

        $data = [
            'title' => trim($this->title),
            'description' => $this->description ?: null,
            'category' => $this->category ?: null,
            'priority' => $this->priority ?: null,
            'size' => $this->size ?: null,
            'start_date' => $this->startDate ?: null,
            'end_date' => $this->endDate ?: null,
            'is_private' => $this->isPrivate,
            'is_recurrent' => $this->isRecurrent,
            'recurrence' => $this->isRecurrent ? [
                'pattern' => 'custom',
                'frequency' => 1,
                'customDays' => max(1, $this->recurrenceIntervalDays),
            ] : null,
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

    public function toggleComplete(string $id, TaskGamificationService $gamification): void
    {
        $task = Task::find($id);
        if ($task) {
            if ($this->prepareRecurringCompletion($task)) {
                return;
            }

            $result = $gamification->toggle($task);

            if ($result['completed']) {
                $this->dispatch('task-completed', ...$result);
            }
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
        $this->isRecurrent = false;
        $this->recurrenceIntervalDays = 7;
        $this->descriptionMode = 'write';
    }

    private function resetBulkForm(): void
    {
        $this->bulkTitles = '';
        $this->bulkDescription = '';
        $this->bulkCategory = '';
        $this->bulkPriority = '';
        $this->bulkSize = '';
        $this->bulkStartDate = null;
        $this->bulkEndDate = null;
        $this->bulkIsPrivate = false;
        $this->bulkDescriptionMode = 'write';
    }

    private function normalizeFilters(): void
    {
        if (! in_array($this->filter, ['pending', 'completed', 'all'], true)) {
            $this->filter = 'pending';
        }

        if ($this->categoryFilter !== '' && ! array_key_exists($this->categoryFilter, $this->categories)) {
            $this->categoryFilter = '';
        }

        if ($this->priorityFilter !== '' && ! array_key_exists($this->priorityFilter, $this->priorities)) {
            $this->priorityFilter = '';
        }
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
