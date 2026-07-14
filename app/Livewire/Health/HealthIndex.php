<?php

namespace App\Livewire\Health;

use App\Models\HealthEvent;
use App\Models\Task;
use App\Models\TaskAssociation;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Salud')]
class HealthIndex extends Component
{
    #[Url(as: 'type', history: true, keep: true)]
    public string $typeFilter = '';

    #[Url(as: 'period', history: true, keep: true)]
    public string $period = 'all';

    public bool $showForm = false;

    public bool $showTaskForm = false;

    public ?string $editingId = null;

    public string $type = 'appointment';

    public string $title = '';

    public string $eventDate = '';

    public ?string $endDate = null;

    public string $notes = '';

    public string $bodyArea = '';

    public string $customBodyArea = '';

    public ?int $severity = null;

    public string $illness = '';

    public string $customIllness = '';

    public string $provider = '';

    public string $specialty = '';

    public string $vaccineName = '';

    public string $vaccineDose = '';

    public string $pendingTitle = '';

    public ?string $pendingDate = null;

    public function mount(): void
    {
        $this->normalizeFilters();
    }

    public function updatedTypeFilter(): void
    {
        $this->normalizeFilters();
    }

    public function updatedPeriod(): void
    {
        $this->normalizeFilters();
    }

    public function openForm(?string $id = null): void
    {
        $this->resetEventForm();
        $this->eventDate = today()->toDateString();

        if ($id && ($event = HealthEvent::find($id))) {
            $this->editingId = $event->id;
            $this->type = $event->type;
            $this->title = $event->title;
            $this->eventDate = $event->event_date->toDateString();
            $this->endDate = $event->end_date?->toDateString();
            $this->notes = $event->notes ?? '';
            $details = $event->details ?? [];
            $storedArea = $details['body_area'] ?? '';
            $this->bodyArea = array_key_exists($storedArea, HealthEvent::BODY_AREAS) ? $storedArea : ($storedArea === '' ? '' : 'other');
            $this->customBodyArea = $details['body_area_note'] ?? ($this->bodyArea === 'other' ? $storedArea : '');
            $this->severity = $details['severity'] ?? null;
            $storedIllness = $details['condition'] ?? '';
            $this->illness = array_key_exists($storedIllness, HealthEvent::COMMON_ILLNESSES) ? $storedIllness : ($storedIllness === '' ? '' : 'other');
            $this->customIllness = $details['condition_note'] ?? ($this->illness === 'other' ? $storedIllness : '');
            $this->provider = $details['provider'] ?? '';
            $this->specialty = $details['specialty'] ?? '';
            $this->vaccineName = $details['vaccine_name'] ?? '';
            $this->vaccineDose = $details['dose'] ?? '';
        }

        $this->showForm = true;
    }

    public function closeForm(): void
    {
        $this->showForm = false;
        $this->resetEventForm();
        $this->resetValidation();
    }

    public function save(): void
    {
        $data = $this->validate($this->eventRules());
        $attributes = [
            'type' => $data['type'],
            'title' => trim($data['title']),
            'event_date' => $data['eventDate'],
            'end_date' => $data['endDate'] ?: null,
            'notes' => $data['notes'] ?: null,
            'details' => $this->detailsFor($data['type']),
        ];

        DB::transaction(function () use ($attributes): void {
            $event = $this->editingId ? HealthEvent::findOrFail($this->editingId) : HealthEvent::create($attributes);

            if ($this->editingId) {
                $event->update($attributes);
            }

            if (in_array($event->type, HealthEvent::SCHEDULED_TYPES, true) && $event->event_date->isFuture()) {
                $task = $event->scheduledTask();
                $taskData = [
                    'title' => 'Salud: '.$event->title,
                    'category' => 'salud',
                    'start_date' => $event->event_date,
                    'end_date' => $event->event_date,
                ];

                if ($task) {
                    $task->update($taskData);
                } else {
                    $task = Task::create([...$taskData, 'task_code' => rand(10000, 99999)]);
                    TaskAssociation::link($task, $event);
                }
            }
        });

        $this->closeForm();
    }

    public function deleteEvent(string $id): void
    {
        HealthEvent::find($id)?->delete();
    }

    public function openTaskForm(): void
    {
        $this->pendingTitle = '';
        $this->pendingDate = today()->toDateString();
        $this->showTaskForm = true;
    }

    public function savePendingTask(): void
    {
        $data = $this->validate([
            'pendingTitle' => ['required', 'string', 'max:160'],
            'pendingDate' => ['nullable', 'date'],
        ]);

        Task::create([
            'title' => trim($data['pendingTitle']),
            'category' => 'salud',
            'start_date' => $data['pendingDate'] ?: null,
            'end_date' => $data['pendingDate'] ?: null,
            'task_code' => rand(10000, 99999),
        ]);

        $this->showTaskForm = false;
        $this->pendingTitle = '';
        $this->pendingDate = null;
    }

    public function render()
    {
        $upcomingQuery = HealthEvent::query()->whereDate('event_date', '>', today());
        $nextEvent = (clone $upcomingQuery)->orderBy('event_date')->first();
        $upcomingCount = (clone $upcomingQuery)->count();
        $pendingHealthTasks = Task::query()
            ->where('category', 'salud')
            ->where('completed', false)
            ->count();

        $query = HealthEvent::query()->with('tasks');

        if ($this->typeFilter !== '') {
            $query->where('type', $this->typeFilter);
        }

        if ($this->period === 'upcoming') {
            $query->whereDate('event_date', '>', today());
        } elseif ($this->period === 'history') {
            $query->whereDate('event_date', '<=', today());
        }

        return view('livewire.health.health-index', [
            'events' => $query->orderByDesc('event_date')->orderByDesc('created_at')->get(),
            'types' => HealthEvent::TYPES,
            'bodyAreas' => HealthEvent::BODY_AREAS,
            'commonIllnesses' => HealthEvent::COMMON_ILLNESSES,
            'nextEvent' => $nextEvent,
            'upcomingCount' => $upcomingCount,
            'pendingHealthTasks' => $pendingHealthTasks,
        ]);
    }

    private function eventRules(): array
    {
        $rules = [
            'type' => ['required', Rule::in(array_keys(HealthEvent::TYPES))],
            'title' => ['required', 'string', 'max:160'],
            'eventDate' => ['required', 'date'],
            'endDate' => ['nullable', 'date', 'after_or_equal:eventDate'],
            'notes' => ['nullable', 'string', 'max:4000'],
        ];

        if ($this->type === 'symptom') {
            $rules['bodyArea'] = ['required', Rule::in(array_keys(HealthEvent::BODY_AREAS))];
            $rules['customBodyArea'] = ['required_if:bodyArea,other', 'nullable', 'string', 'max:100'];
            $rules['severity'] = ['nullable', 'integer', 'between:1,5'];
        }
        if ($this->type === 'illness') {
            $rules['illness'] = ['required', Rule::in(array_keys(HealthEvent::COMMON_ILLNESSES))];
            $rules['customIllness'] = ['required_if:illness,other', 'nullable', 'string', 'max:120'];
        }
        if (in_array($this->type, ['appointment', 'checkup'], true)) {
            $rules['provider'] = ['nullable', 'string', 'max:120'];
            $rules['specialty'] = ['nullable', 'string', 'max:120'];
        }
        if ($this->type === 'vaccination') {
            $rules['vaccineName'] = ['nullable', 'string', 'max:120'];
            $rules['vaccineDose'] = ['nullable', 'string', 'max:80'];
        }

        return $rules;
    }

    private function detailsFor(string $type): ?array
    {
        $details = match ($type) {
            'symptom' => array_filter(['body_area' => $this->bodyArea, 'body_area_note' => $this->bodyArea === 'other' ? trim($this->customBodyArea) : null, 'severity' => $this->severity], fn ($value) => $value !== null && $value !== ''),
            'illness' => array_filter(['condition' => $this->illness, 'condition_note' => $this->illness === 'other' ? trim($this->customIllness) : null]),
            'appointment', 'checkup' => array_filter(['provider' => trim($this->provider), 'specialty' => trim($this->specialty)]),
            'vaccination' => array_filter(['vaccine_name' => trim($this->vaccineName), 'dose' => trim($this->vaccineDose)]),
            default => [],
        };

        return $details === [] ? null : $details;
    }

    private function resetEventForm(): void
    {
        $this->editingId = null;
        $this->type = 'appointment';
        $this->title = '';
        $this->eventDate = '';
        $this->endDate = null;
        $this->notes = '';
        $this->bodyArea = '';
        $this->customBodyArea = '';
        $this->severity = null;
        $this->illness = '';
        $this->customIllness = '';
        $this->provider = '';
        $this->specialty = '';
        $this->vaccineName = '';
        $this->vaccineDose = '';
    }

    private function normalizeFilters(): void
    {
        if ($this->typeFilter !== '' && ! array_key_exists($this->typeFilter, HealthEvent::TYPES)) {
            $this->typeFilter = '';
        }
        if (! in_array($this->period, ['all', 'upcoming', 'history'], true)) {
            $this->period = 'all';
        }
    }
}
