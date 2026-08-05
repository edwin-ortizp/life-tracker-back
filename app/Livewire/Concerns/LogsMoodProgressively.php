<?php

namespace App\Livewire\Concerns;

use App\Models\MoodEntry;
use App\Models\MoodState;
use App\Models\Relationship;
use App\Support\MoodCatalog;
use App\Support\MoodLogger;

/**
 * Shared progressive logging: one tap writes the entry, and everything afterwards —
 * the confirmation, the context sheet, the linked people — is optional and never
 * blocks the page. Used by Ánimo, Inicio and Diario so the minimum path is identical.
 */
trait LogsMoodProgressively
{
    /** The entry the confirmation refers to; Undo is scoped to exactly this one. */
    public ?string $lastMoodEntryId = null;

    public bool $showMoodCatalog = false;

    public string $moodCatalogSearch = '';

    public bool $showMoodContext = false;

    public ?string $contextEntryId = null;

    public ?int $contextIntensity = null;

    public string $contextSituation = '';

    public string $contextRelationshipSearch = '';

    /** @var list<string> */
    public array $contextRelationshipIds = [];

    protected function moodLogger(): MoodLogger
    {
        return app(MoodLogger::class);
    }

    /** The date this surface is logging for; surfaces with a date picker override it. */
    protected function moodLogDate(): ?string
    {
        return property_exists($this, 'selectedDate') ? $this->selectedDate : null;
    }

    public function logMood(string $moodStateId): void
    {
        $state = MoodState::find($moodStateId);

        if (! $state) {
            return;
        }

        $entry = $this->moodLogger()->record($state, $this->moodLogDate());

        $this->lastMoodEntryId = $entry->id;
        $this->showMoodCatalog = false;
        $this->moodCatalogSearch = '';
    }

    /**
     * Recovery from the empty state, available on every surface. It is always explicit:
     * a fully deactivated catalog is a valid decision and is never undone on its own.
     */
    public function restoreMoodCatalog(): void
    {
        app(MoodCatalog::class)->restore(auth()->user());
    }

    public function dismissMoodConfirmation(): void
    {
        $this->lastMoodEntryId = null;
    }

    /** Undo removes only the entry the confirmation was about. */
    public function undoLastMood(): void
    {
        if (! $this->lastMoodEntryId) {
            return;
        }

        MoodEntry::whereKey($this->lastMoodEntryId)->first()?->delete();
        $this->lastMoodEntryId = null;
        $this->showMoodContext = false;
        $this->contextEntryId = null;
    }

    public function openMoodCatalog(): void
    {
        $this->moodCatalogSearch = '';
        $this->showMoodCatalog = true;
    }

    public function closeMoodCatalog(): void
    {
        $this->showMoodCatalog = false;
        $this->moodCatalogSearch = '';
    }

    /** Opened only on demand: it never appears by itself after saving. */
    public function openMoodContext(?string $entryId = null): void
    {
        $entry = MoodEntry::with('relationships:id')->find($entryId ?? $this->lastMoodEntryId);

        if (! $entry) {
            return;
        }

        $this->contextEntryId = $entry->id;
        $this->contextIntensity = $entry->intensity;
        $this->contextSituation = $entry->situation ?? '';
        $this->contextRelationshipIds = $entry->relationships->pluck('id')->all();
        $this->contextRelationshipSearch = '';
        $this->resetValidation();
        $this->showMoodContext = true;
    }

    public function closeMoodContext(): void
    {
        $this->showMoodContext = false;
        $this->contextEntryId = null;
        $this->contextRelationshipSearch = '';
    }

    public function setContextIntensity(?int $intensity): void
    {
        $this->contextIntensity = $this->contextIntensity === $intensity ? null : $intensity;
    }

    /** A suggested person is only linked once the user picks it explicitly. */
    public function toggleContextRelationship(string $relationshipId): void
    {
        if (! Relationship::whereKey($relationshipId)->exists()) {
            return;
        }

        $this->contextRelationshipIds = in_array($relationshipId, $this->contextRelationshipIds, true)
            ? array_values(array_diff($this->contextRelationshipIds, [$relationshipId]))
            : [...$this->contextRelationshipIds, $relationshipId];
    }

    public function saveMoodContext(): void
    {
        $validated = $this->validate([
            'contextIntensity' => ['nullable', 'integer', 'between:1,5'],
            'contextSituation' => ['nullable', 'string', 'max:500'],
            'contextRelationshipIds' => ['array'],
        ]);

        $entry = MoodEntry::find($this->contextEntryId);

        if (! $entry) {
            $this->closeMoodContext();

            return;
        }

        $entry->update([
            'intensity' => $validated['contextIntensity'],
            'situation' => trim($validated['contextSituation']) ?: null,
        ]);
        $entry->syncRelationships($this->contextRelationshipIds);

        $this->closeMoodContext();
    }

    /** View data every surface passes straight to the shared partial. */
    protected function moodProgressiveData(): array
    {
        $logger = $this->moodLogger();

        return [
            'progressiveEntry' => $this->lastMoodEntryId ? MoodEntry::find($this->lastMoodEntryId) : null,
            'contextEntry' => $this->contextEntryId ? MoodEntry::with('relationships')->find($this->contextEntryId) : null,
            'catalogStates' => $this->showMoodCatalog ? $logger->catalog($this->moodCatalogSearch) : collect(),
            'suggestedRelationships' => $this->showMoodContext
                ? $logger->suggestedRelationships($this->contextRelationshipSearch)
                : collect(),
        ];
    }
}
