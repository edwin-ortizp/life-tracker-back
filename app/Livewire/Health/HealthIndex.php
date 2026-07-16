<?php

namespace App\Livewire\Health;

use App\Models\HealthEvent;
use App\Models\HealthLog;
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

    public bool $showLogForm = false;

    public bool $showRecoveryForm = false;

    public ?string $editingId = null;

    public ?string $loggingEventId = null;

    public ?string $editingLogId = null;

    public ?string $recoveringEventId = null;

    public string $type = 'appointment';

    public string $title = '';

    public string $eventDate = '';

    public ?string $endDate = null;

    public string $notes = '';

    public string $bodyArea = '';

    public string $customBodyArea = '';

    public ?int $initialIntensity = null;

    public ?int $storedIntensity = null;

    public string $illness = '';

    public string $customIllness = '';

    public string $provider = '';

    public string $specialty = '';

    public string $vaccineName = '';

    public string $vaccineDose = '';

    public string $pendingTitle = '';

    public ?string $pendingDate = null;

    public string $logDate = '';

    public ?int $logIntensity = null;

    public string $logNotes = '';

    public string $recoveryDate = '';

    public ?int $recoveryIntensity = null;

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

    public function updatedRecoveryDate(): void
    {
        if ($this->recoveringEventId) {
            $this->recoveryIntensity = HealthLog::query()
                ->where('health_event_id', $this->recoveringEventId)
                ->whereDate('date', $this->recoveryDate)
                ->value('intensity');
        }
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
            $this->storedIntensity = $details['severity'] ?? null;
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
            'type' => $data['type'], 'title' => trim($data['title']), 'event_date' => $data['eventDate'],
            'end_date' => $data['endDate'] ?: null, 'notes' => $data['notes'] ?: null, 'details' => $this->detailsFor($data['type']),
        ];

        DB::transaction(function () use ($attributes, $data): void {
            $event = $this->editingId ? HealthEvent::findOrFail($this->editingId) : HealthEvent::create($attributes);
            if ($this->editingId) {
                $event->update($attributes);
            } elseif ($this->tracksEvolution($event)) {
                $event->logs()->create(['date' => $event->event_date, 'intensity' => $data['initialIntensity']]);
            }
            if (in_array($event->type, HealthEvent::SCHEDULED_TYPES, true) && $event->event_date->isFuture()) {
                $task = $event->scheduledTask();
                $taskData = ['title' => 'Salud: '.$event->title, 'category' => 'salud', 'start_date' => $event->event_date, 'end_date' => $event->event_date];
                $task ? $task->update($taskData) : TaskAssociation::link(Task::create([...$taskData, 'task_code' => rand(10000, 99999)]), $event);
            }
        });
        $this->closeForm();
    }

    public function deleteEvent(string $id): void
    {
        HealthEvent::find($id)?->delete();
    }

    public function openLogForm(string $eventId): void
    {
        $event = HealthEvent::findOrFail($eventId);
        abort_unless($this->tracksEvolution($event) && ! $event->end_date, 404);
        $this->loggingEventId = $event->id;
        $this->editingLogId = null;
        $this->logDate = today()->toDateString();
        $this->logIntensity = null;
        $this->logNotes = '';
        $this->resetValidation();
        $this->showLogForm = true;
    }

    public function saveLog(): void
    {
        $data = $this->validate(['logDate' => ['required', 'date'], 'logIntensity' => ['required', 'integer', 'between:1,10'], 'logNotes' => ['nullable', 'string', 'max:1000']]);
        $event = HealthEvent::findOrFail($this->loggingEventId);
        abort_unless($this->tracksEvolution($event) && ! $event->end_date, 404);
        if ($data['logDate'] < $event->event_date->toDateString()) {
            $this->addError('logDate', 'La fecha no puede ser anterior al inicio del malestar.');

            return;
        }
        if ($event->logs()->whereDate('date', $data['logDate'])->exists()) {
            $this->addError('logDate', 'Ya hay una intensidad registrada para este día. Puedes editarla en el historial.');

            return;
        }
        $event->logs()->create(['date' => $data['logDate'], 'intensity' => $data['logIntensity'], 'notes' => trim($data['logNotes']) ?: null]);
        $this->closeLogForm();
    }

    public function editLog(string $id): void
    {
        $log = HealthLog::findOrFail($id);
        $this->loggingEventId = $log->health_event_id;
        $this->editingLogId = $log->id;
        $this->logDate = $log->date->toDateString();
        $this->logIntensity = $log->intensity;
        $this->logNotes = $log->notes ?? '';
        $this->resetValidation();
        $this->showLogForm = true;
    }

    public function updateLog(): void
    {
        $data = $this->validate(['logIntensity' => ['required', 'integer', 'between:1,10'], 'logNotes' => ['nullable', 'string', 'max:1000']]);
        $log = HealthLog::findOrFail($this->editingLogId);
        $log->update(['intensity' => $data['logIntensity'], 'notes' => trim($data['logNotes']) ?: null]);
        $this->closeLogForm();
    }

    public function deleteLog(string $id): void
    {
        HealthLog::findOrFail($id)->delete();
    }

    public function closeLogForm(): void
    {
        $this->showLogForm = false;
        $this->loggingEventId = null;
        $this->editingLogId = null;
        $this->logDate = '';
        $this->logIntensity = null;
        $this->logNotes = '';
        $this->resetValidation();
    }

    public function openRecoveryForm(string $eventId): void
    {
        $event = HealthEvent::findOrFail($eventId);
        abort_unless($this->tracksEvolution($event) && ! $event->end_date, 404);
        $this->recoveringEventId = $event->id;
        $this->recoveryDate = today()->toDateString();
        $this->recoveryIntensity = $event->logs()->whereDate('date', $this->recoveryDate)->value('intensity');
        $this->resetValidation();
        $this->showRecoveryForm = true;
    }

    public function reopenEvolution(string $eventId): void
    {
        $event = HealthEvent::findOrFail($eventId);
        abort_unless($this->tracksEvolution($event) && $event->end_date, 404);

        $event->update(['end_date' => null]);
    }

    public function saveRecovery(): void
    {
        $data = $this->validate(['recoveryDate' => ['required', 'date'], 'recoveryIntensity' => ['nullable', 'integer', 'between:1,10']]);
        $event = HealthEvent::findOrFail($this->recoveringEventId);
        abort_unless($this->tracksEvolution($event) && ! $event->end_date, 404);
        if ($data['recoveryDate'] < $event->event_date->toDateString()) {
            $this->addError('recoveryDate', 'La recuperación no puede ser anterior al inicio.');

            return;
        }
        $log = $event->logs()->whereDate('date', $data['recoveryDate'])->first();
        if (! $log && $data['recoveryIntensity'] === null) {
            $this->addError('recoveryIntensity', 'Indica la intensidad del día de recuperación.');

            return;
        }
        if (! $log) {
            $event->logs()->create(['date' => $data['recoveryDate'], 'intensity' => $data['recoveryIntensity']]);
        }
        $event->update(['end_date' => $data['recoveryDate']]);
        $this->showRecoveryForm = false;
        $this->recoveringEventId = null;
        $this->resetValidation();
    }

    public function openTaskForm(): void
    {
        $this->pendingTitle = '';
        $this->pendingDate = today()->toDateString();
        $this->showTaskForm = true;
    }

    public function savePendingTask(): void
    {
        $data = $this->validate(['pendingTitle' => ['required', 'string', 'max:160'], 'pendingDate' => ['nullable', 'date']]);
        Task::create(['title' => trim($data['pendingTitle']), 'category' => 'salud', 'start_date' => $data['pendingDate'] ?: null, 'end_date' => $data['pendingDate'] ?: null, 'task_code' => rand(10000, 99999)]);
        $this->showTaskForm = false;
        $this->pendingTitle = '';
        $this->pendingDate = null;
    }

    public function render()
    {
        $upcomingQuery = HealthEvent::query()->whereDate('event_date', '>', today());
        $nextEvent = (clone $upcomingQuery)->orderBy('event_date')->first();
        $healthTasks = Task::query()
            ->where('category', 'salud')
            ->where('completed', false)
            ->orderByRaw('CASE WHEN start_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('start_date')
            ->orderBy('created_at')
            ->limit(5)
            ->get();
        $query = HealthEvent::query()->with(['tasks', 'logs']);
        if ($this->typeFilter !== '') {
            $query->where('type', $this->typeFilter);
        }
        if ($this->period === 'upcoming') {
            $query->whereDate('event_date', '>', today());
        } elseif ($this->period === 'history') {
            $query->whereDate('event_date', '<=', today());
        }

        return view('livewire.health.health-index', [
            'events' => $query->orderByDesc('event_date')->orderByDesc('created_at')->get(), 'types' => HealthEvent::TYPES,
            'bodyAreas' => HealthEvent::BODY_AREAS, 'commonIllnesses' => HealthEvent::COMMON_ILLNESSES, 'nextEvent' => $nextEvent,
            'upcomingCount' => (clone $upcomingQuery)->count(), 'pendingHealthTasks' => Task::query()->where('category', 'salud')->where('completed', false)->count(), 'healthTasks' => $healthTasks,
        ]);
    }

    private function eventRules(): array
    {
        $rules = ['type' => ['required', Rule::in(array_keys(HealthEvent::TYPES))], 'title' => ['required', 'string', 'max:160'], 'eventDate' => ['required', 'date'], 'endDate' => ['nullable', 'date', 'after_or_equal:eventDate'], 'notes' => ['nullable', 'string', 'max:4000']];
        if (in_array($this->type, ['symptom', 'illness'], true) && ! $this->editingId) {
            $rules['initialIntensity'] = ['required', 'integer', 'between:1,10'];
        }
        if ($this->type === 'symptom') {
            $rules['bodyArea'] = ['required', Rule::in(array_keys(HealthEvent::BODY_AREAS))];
            $rules['customBodyArea'] = ['required_if:bodyArea,other', 'nullable', 'string', 'max:100'];
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
            'symptom' => array_filter(['body_area' => $this->bodyArea, 'body_area_note' => $this->bodyArea === 'other' ? trim($this->customBodyArea) : null, 'severity' => $this->storedIntensity], fn ($value) => $value !== null && $value !== ''),
            'illness' => array_filter(['condition' => $this->illness, 'condition_note' => $this->illness === 'other' ? trim($this->customIllness) : null]),
            'appointment', 'checkup' => array_filter(['provider' => trim($this->provider), 'specialty' => trim($this->specialty)]),
            'vaccination' => array_filter(['vaccine_name' => trim($this->vaccineName), 'dose' => trim($this->vaccineDose)]), default => [],
        };

        return $details === [] ? null : $details;
    }

    private function tracksEvolution(HealthEvent $event): bool
    {
        return in_array($event->type, ['symptom', 'illness'], true);
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
        $this->initialIntensity = null;
        $this->storedIntensity = null;
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
