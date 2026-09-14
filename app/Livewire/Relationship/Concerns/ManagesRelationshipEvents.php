<?php

namespace App\Livewire\Relationship\Concerns;

use App\Models\RelationshipEvent;
use App\Support\EventDate;
use InvalidArgumentException;

/**
 * Formulario de acontecimientos de una persona, compartido por Inicio e Historial.
 * Requiere ResolvesRelationship.
 */
trait ManagesRelationshipEvents
{
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

    protected function events()
    {
        return $this->relationship()->relationshipEvents();
    }

    protected function resetEventForm(): void
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
}
