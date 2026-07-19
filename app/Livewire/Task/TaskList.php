<?php

namespace App\Livewire\Task;

use App\Livewire\Concerns\HandlesRecurringTaskCompletion;
use App\Livewire\Concerns\InteractsWithTaskSchedule;
use App\Models\Task;
use App\Services\TaskGamificationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('layouts.app')]
#[Title('Tareas')]
class TaskList extends Component
{
    use HandlesRecurringTaskCompletion, InteractsWithTaskSchedule, WithPagination;

    #[Url(as: 'status', history: true, keep: true)]
    public string $filter = 'pending'; // pending, completed, all

    #[Url(as: 'category', history: true, keep: true)]
    public string $categoryFilter = '';

    #[Url(as: 'priority', history: true, keep: true)]
    public string $priorityFilter = '';

    #[Url(as: 'date', history: true, keep: true)]
    public string $dateFilter = '';

    #[Url(as: 'q', history: true, keep: true)]
    public string $search = '';

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

    public ?int $estimatedTime = null;

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

    public ?int $bulkEstimatedTime = null;

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
        $this->resetPage();
    }

    public function updatedCategoryFilter(): void
    {
        $this->normalizeFilters();
        $this->resetPage();
    }

    public function updatedPriorityFilter(): void
    {
        $this->normalizeFilters();
        $this->resetPage();
    }

    public function updatedDateFilter(): void
    {
        $this->normalizeFilters();
        $this->resetPage();
    }

    public function updatedSearch(): void
    {
        $this->resetPage();
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
                $this->loadTaskSchedule($task);
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
        $lines = collect(preg_split('/\R/', $this->bulkTitles) ?: [])
            ->map(fn (string $line) => trim($line))
            ->filter()
            ->values();

        if ($lines->isEmpty()) {
            $this->addError('bulkTitles', 'Escribe al menos una tarea.');

            return;
        }

        $schedule = $this->bulkTaskScheduleData();
        if (! $schedule) {
            return;
        }

        $baseData = [
            'description' => $this->bulkDescription ?: null,
            'category' => $this->bulkCategory ?: null,
            'priority' => $this->bulkPriority ?: null,
            'size' => $this->bulkSize ?: null,
            ...$schedule,
            'is_private' => $this->bulkIsPrivate,
        ];

        DB::transaction(function () use ($lines, $baseData) {
            foreach ($lines as $line) {
                $parsed = $this->parseObsidianLine($line);
                $data = array_filter($parsed['overrides'], fn ($v) => $v !== null) + $baseData;
                $data['title'] = $parsed['title'];
                $data['task_code'] = rand(10000, 99999);
                Task::create($data);
            }
        });

        $this->closeBulkForm();
    }

    private function parseObsidianLine(string $line): array
    {
        $overrides = [];

        $priorityMap = [
            "\u{1F53A}" => 'urgent-important',
            "\u{1F53C}" => 'not-urgent-important',
            "\u{1F53D}" => 'not-urgent-not-important',
        ];

        foreach ($priorityMap as $emoji => $priority) {
            if (str_contains($line, $emoji)) {
                $overrides['priority'] = $priority;
                $line = str_replace($emoji, '', $line);
            }
        }

        $datePattern = '/([\x{1F4C5}\x{1F6EB}\x{231B}\x{2705}])\s*(\d{4}-\d{2}-\d{2})/u';

        if (preg_match_all($datePattern, $line, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $emoji = $match[1];
                $date = $match[2];

                match ($emoji) {
                    "\u{1F4C5}" => $overrides['end_date'] = Carbon::parse($date),
                    "\u{1F6EB}" => $overrides['start_date'] = Carbon::parse($date),
                    "\u{231B}" => $overrides['start_date'] ??= Carbon::parse($date),
                    "\u{2705}" => (function () use (&$overrides, $date) {
                        $overrides['completed'] = true;
                        $overrides['completed_at'] = Carbon::parse($date);
                    })(),
                    default => null,
                };
            }

            $line = preg_replace($datePattern, '', $line);
        }

        $title = trim(preg_replace('/\s+/', ' ', $line));

        return ['title' => $title, 'overrides' => $overrides];
    }

    public function save()
    {
        if (empty(trim($this->title))) {
            return;
        }

        $schedule = $this->taskScheduleData();
        if (! $schedule) {
            return;
        }

        $data = [
            'title' => trim($this->title),
            'description' => $this->description ?: null,
            'category' => $this->category ?: null,
            'priority' => $this->priority ?: null,
            'size' => $this->size ?: null,
            ...$schedule,
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
        $this->startTime = null;
        $this->endDate = null;
        $this->endTime = null;
        $this->estimatedTime = null;
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
        $this->bulkStartTime = null;
        $this->bulkEndDate = null;
        $this->bulkEndTime = null;
        $this->bulkEstimatedTime = null;
        $this->bulkIsPrivate = false;
        $this->bulkDescriptionMode = 'write';
    }

    private function normalizeFilters(): void
    {
        if (! in_array($this->filter, ['pending', 'completed', 'all'], true)) {
            $this->filter = 'pending';
        }

        if ($this->categoryFilter !== '' && $this->categoryFilter !== '__none__' && ! array_key_exists($this->categoryFilter, $this->categories)) {
            $this->categoryFilter = '';
        }

        if ($this->priorityFilter !== '' && ! array_key_exists($this->priorityFilter, $this->priorities)) {
            $this->priorityFilter = '';
        }

        if ($this->dateFilter !== '' && ! in_array($this->dateFilter, ['sin-fecha', 'vencidas', 'hoy', 'proximas'], true)) {
            $this->dateFilter = '';
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

        if ($this->categoryFilter === '__none__') {
            $query->whereNull('category');
        } elseif ($this->categoryFilter) {
            $query->where('category', $this->categoryFilter);
        }

        if ($this->priorityFilter) {
            $query->where('priority', $this->priorityFilter);
        }

        match ($this->dateFilter) {
            'sin-fecha' => $query->whereNull('start_date')->whereNull('end_date'),
            'vencidas' => $query->where('completed', false)->where(fn ($q) => $q
                ->where('end_date', '<', now())
                ->orWhere(fn ($q2) => $q2->whereNull('end_date')->where('start_date', '<', now()))
            ),
            'hoy' => $query->where(fn ($q) => $q
                ->whereDate('start_date', today())
                ->orWhereDate('end_date', today())
            ),
            'proximas' => $query->where(fn ($q) => $q
                ->where('start_date', '>', now())
                ->orWhere(fn ($q2) => $q2->whereNull('start_date')->where('end_date', '>', now()))
            ),
            default => null,
        };

        if ($this->search !== '') {
            $term = '%'.$this->search.'%';
            $query->where(fn ($q) => $q
                ->where('title', 'like', $term)
                ->orWhere('description', 'like', $term)
            );
        }

        $tasks = $query->orderByRaw('CASE WHEN priority = "urgent-important" THEN 1 WHEN priority = "not-urgent-important" THEN 2 WHEN priority = "urgent-not-important" THEN 3 ELSE 4 END')
            ->orderByDesc('created_at')
            ->paginate(25);

        $stats = Task::selectRaw('
            SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_count,
            SUM(CASE WHEN completed = 1 AND DATE(completed_at) = CURDATE() THEN 1 ELSE 0 END) as completed_today,
            SUM(CASE WHEN completed = 0 AND (DATE(start_date) = CURDATE() OR DATE(end_date) = CURDATE()) THEN 1 ELSE 0 END) as planned_today,
            SUM(CASE WHEN completed = 0 AND (end_date < NOW() OR (end_date IS NULL AND start_date < NOW())) THEN 1 ELSE 0 END) as overdue_count
        ')->first();

        $categoryBreakdown = Task::where('completed', true)
            ->whereDate('completed_at', today())
            ->whereNotNull('category')
            ->selectRaw('category, COUNT(*) as total')
            ->groupBy('category')
            ->pluck('total', 'category')
            ->toArray();

        return view('livewire.task.task-list', [
            'tasks' => $tasks,
            'pendingCount' => (int) $stats->pending_count,
            'completedCount' => (int) $stats->completed_count,
            'completedToday' => (int) $stats->completed_today,
            'plannedToday' => (int) $stats->planned_today,
            'overdueCount' => (int) $stats->overdue_count,
            'categoryBreakdown' => $categoryBreakdown,
        ]);
    }
}
