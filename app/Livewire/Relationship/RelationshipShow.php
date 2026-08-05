<?php

namespace App\Livewire\Relationship;

use App\Models\Relationship;
use App\Models\RelationshipEvent;
use App\Models\Task;
use App\Models\TaskAssociation;
use App\Support\EventDate;
use App\Support\RelationshipEmotionalPatterns;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Detalle de la relación')]
class RelationshipShow extends Component
{
    public string $relationshipId;

    // Event form
    public bool $showEventForm = false;

    public ?string $editingEventId = null;

    public string $eventTitle = '';

    public string $eventCategory = 'milestone';

    public string $eventNotes = '';

    public string $eventPrecision = EventDate::DAY;

    public ?string $eventDate = null;

    public ?int $eventYear = null;

    public ?int $eventMonth = null;

    public ?string $eventStartsOn = null;

    public ?string $eventEndsOn = null;

    public bool $eventIsSensitive = false;

    public bool $showArchivedEvents = false;

    // Task form
    public bool $showTaskForm = false;

    public string $taskTitle = '';

    public string $taskDescription = '';

    public string $taskPriority = '';

    public ?string $taskDueDate = null;

    public bool $taskIsPrivate = false;

    // Linked emotional context
    #[Url(as: 'emotions', history: true)]
    public int $patternDays = 30;

    /** Reflection bodies stay collapsed until the owner opens one. */
    public array $expandedReflections = [];

    public array $priorities = [
        'urgent-important' => 'Urgente e importante',
        'not-urgent-important' => 'No urgente, importante',
        'urgent-not-important' => 'Urgente, no importante',
        'not-urgent-not-important' => 'No urgente, no importante',
    ];

    public function mount(string $relationship): void
    {
        $this->relationshipId = Relationship::query()->findOrFail($relationship)->id;
        $this->eventDate = today()->toDateString();
    }

    public function openEventForm(?string $id = null): void
    {
        $this->resetEventForm();

        if ($id) {
            $event = $this->events()->findOrFail($id);

            $this->editingEventId = $event->id;
            $this->eventTitle = $event->title;
            $this->eventCategory = $event->category ?? 'other';
            $this->eventNotes = $event->notes ?? '';
            $this->eventPrecision = $event->date_precision ?? EventDate::DAY;
            $this->eventIsSensitive = $event->is_sensitive;
            $this->eventDate = $event->starts_on?->toDateString();
            $this->eventYear = $event->starts_on?->year;
            $this->eventMonth = $event->starts_on?->month;
            $this->eventStartsOn = $event->starts_on?->toDateString();
            $this->eventEndsOn = $event->ends_on?->toDateString();
        }

        $this->showEventForm = true;
    }

    public function saveEvent(): void
    {
        $validated = $this->validate([
            'eventTitle' => ['required', 'string', 'max:255'],
            'eventCategory' => ['required', 'in:'.implode(',', array_keys(RelationshipEvent::CATEGORIES))],
            'eventNotes' => ['nullable', 'string', 'max:5000'],
            'eventPrecision' => ['required', 'in:'.implode(',', array_keys(EventDate::PRECISIONS))],
            'eventDate' => ['nullable', 'date'],
            'eventYear' => ['nullable', 'integer', 'between:1900,2200'],
            'eventMonth' => ['nullable', 'integer', 'between:1,12'],
            'eventStartsOn' => ['nullable', 'date'],
            'eventEndsOn' => ['nullable', 'date'],
            'eventIsSensitive' => ['boolean'],
        ]);

        try {
            $date = EventDate::fromInput(
                $validated['eventPrecision'],
                $validated['eventDate'],
                $validated['eventYear'],
                $validated['eventMonth'],
                $validated['eventStartsOn'],
                $validated['eventEndsOn'],
            );
        } catch (InvalidArgumentException $exception) {
            $this->addError('eventPrecision', $exception->getMessage());

            return;
        }

        $attributes = [
            'title' => trim($validated['eventTitle']),
            'category' => $validated['eventCategory'],
            'notes' => trim($validated['eventNotes']) ?: null,
            'is_sensitive' => $validated['eventIsSensitive'],
            ...$date->toAttributes(),
        ];

        if ($this->editingEventId) {
            $this->events()->findOrFail($this->editingEventId)->update($attributes);
        } else {
            $this->relationship()->relationshipEvents()->create($attributes);
        }

        $this->showEventForm = false;
        $this->resetEventForm();
    }

    public function toggleEventArchive(string $id): void
    {
        $event = $this->events()->findOrFail($id);

        $event->update([
            'is_archived' => ! $event->is_archived,
            'archived_at' => $event->is_archived ? null : now(),
        ]);
    }

    public function deleteEvent(string $id): void
    {
        $this->events()->findOrFail($id)->delete();
    }

    public function openTaskForm(?string $suggestedTitle = null, ?string $dueDate = null): void
    {
        $this->resetTaskForm();
        $this->taskTitle = $suggestedTitle ?? '';
        $this->taskDueDate = $dueDate;
        $this->showTaskForm = true;
    }

    public function suggestFollowUpTask(): void
    {
        $this->openTaskForm('Contactar a '.$this->relationship()->displayName(), today()->toDateString());
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

    public function markContact(): void
    {
        $this->relationship()->update(['last_contact_at' => now()]);
    }

    public function toggleArchive(): void
    {
        $relationship = $this->relationship();

        $relationship->update([
            'is_archived' => ! $relationship->is_archived,
            'archived_at' => $relationship->is_archived ? null : now(),
        ]);
    }

    public function setPatternDays(int $days): void
    {
        $this->patternDays = RelationshipEmotionalPatterns::periodDays($days);
    }

    public function toggleReflection(string $entryId): void
    {
        $this->expandedReflections = in_array($entryId, $this->expandedReflections, true)
            ? array_values(array_diff($this->expandedReflections, [$entryId]))
            : [...$this->expandedReflections, $entryId];
    }

    /** Removes the link only: the emotional entry and its reflection stay with the user. */
    public function unlinkMoodEntry(string $entryId): void
    {
        $relationship = $this->relationship();
        $entry = $relationship->moodEntries()->findOrFail($entryId);

        $entry->unlinkRelationship($relationship);
        $this->expandedReflections = array_values(array_diff($this->expandedReflections, [$entryId]));
    }

    public function render()
    {
        $this->patternDays = RelationshipEmotionalPatterns::periodDays($this->patternDays);

        $relationship = Relationship::query()
            ->with([
                'circle',
                'tags',
                'contactMethods',
                'tasks' => fn ($query) => $query->orderBy('completed')->orderByDesc('created_at'),
            ])
            ->findOrFail($this->relationshipId);

        // The private timeline of a relationship deliberately includes sensitive entries.
        $events = $relationship->relationshipEvents()
            ->when(! $this->showArchivedEvents, fn ($query) => $query->active())
            ->chronological('desc')
            ->get();

        $moodEntries = $relationship->moodEntries()
            ->with('reflection')
            ->chronological()
            ->get();

        return view('livewire.relationship.relationship-show', [
            'relationship' => $relationship,
            'birthday' => $relationship->birthday(),
            'moodEntries' => $moodEntries,
            'patterns' => RelationshipEmotionalPatterns::summarize($relationship, $this->patternDays),
            'patternPeriods' => RelationshipEmotionalPatterns::PERIODS,
            'upcomingEvents' => $events->filter(fn (RelationshipEvent $event) => $event->isUpcoming())->sortBy('starts_on')->values(),
            'pastEvents' => $events->reject(fn (RelationshipEvent $event) => $event->isUpcoming())->values(),
            'pendingTasks' => $relationship->tasks->reject(fn (Task $task) => $task->completed)->values(),
            'completedTasks' => $relationship->tasks->filter(fn (Task $task) => $task->completed)->values(),
        ]);
    }

    private function relationship(): Relationship
    {
        return Relationship::query()->findOrFail($this->relationshipId);
    }

    private function events()
    {
        return $this->relationship()->relationshipEvents();
    }

    private function resetEventForm(): void
    {
        $this->editingEventId = null;
        $this->eventTitle = '';
        $this->eventCategory = 'milestone';
        $this->eventNotes = '';
        $this->eventPrecision = EventDate::DAY;
        $this->eventDate = today()->toDateString();
        $this->eventYear = today()->year;
        $this->eventMonth = today()->month;
        $this->eventStartsOn = today()->toDateString();
        $this->eventEndsOn = today()->toDateString();
        $this->eventIsSensitive = false;
        $this->resetValidation();
    }

    private function resetTaskForm(): void
    {
        $this->taskTitle = '';
        $this->taskDescription = '';
        $this->taskPriority = '';
        $this->taskDueDate = null;
        $this->taskIsPrivate = false;
        $this->resetValidation();
    }
}
