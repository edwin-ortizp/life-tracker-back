<?php

namespace App\Livewire\Mood;

use App\Livewire\Concerns\HasUrlDate;
use App\Livewire\Concerns\LogsMoodProgressively;
use App\Models\EnergyEntry;
use App\Models\MoodEntry;
use App\Models\MoodState;
use Carbon\Carbon;
use Livewire\Attributes\Layout;
use Livewire\Attributes\On;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Estado de Ánimo')]
class MoodTracker extends Component
{
    use HasUrlDate, LogsMoodProgressively;

    // Editing an entry's primary emotion from the history
    public bool $showEditForm = false;

    public ?string $editingEntryId = null;

    public string $editMoodStateId = '';

    // Reflection wizard
    public ?string $reflectionEntryId = null;

    // Energy form
    public int $energyLevel = 3;

    public string $energyComment = '';

    public bool $showEnergyForm = false;

    public function mount()
    {
        $this->initializeSelectedDate();
    }

    public function previousDay()
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->subDay()->toDateString();
    }

    public function nextDay()
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->addDay()->toDateString();
    }

    public function today()
    {
        $this->selectedDate = now()->toDateString();
    }

    /** One tap saves; context and reflection stay optional afterwards. */
    public function saveMood(string $moodStateId)
    {
        $this->logMood($moodStateId);
    }

    public function openEditForm(string $entryId): void
    {
        $entry = MoodEntry::findOrFail($entryId);

        $this->editingEntryId = $entry->id;
        $this->editMoodStateId = $entry->mood_state_id ?? '';
        $this->showEditForm = true;
    }

    public function closeEditForm(): void
    {
        $this->showEditForm = false;
        $this->editingEntryId = null;
    }

    /** Replaces the single primary emotion, leaving intensity, situation and links intact. */
    public function updateMoodState(string $moodStateId): void
    {
        $entry = MoodEntry::findOrFail($this->editingEntryId);
        $state = MoodState::findOrFail($moodStateId);

        $entry->applyMoodState($state);
        $this->closeEditForm();
    }

    public function deleteMood(string $id)
    {
        MoodEntry::whereKey($id)->first()?->delete();

        if ($this->lastMoodEntryId === $id) {
            $this->lastMoodEntryId = null;
        }

        if ($this->reflectionEntryId === $id) {
            $this->reflectionEntryId = null;
        }
    }

    public function openReflection(string $entryId): void
    {
        $this->reflectionEntryId = MoodEntry::findOrFail($entryId)->id;
    }

    #[On('reflection-closed')]
    public function closeReflection(): void
    {
        $this->reflectionEntryId = null;
    }

    public function openEnergyForm()
    {
        $this->energyLevel = 3;
        $this->energyComment = '';
        $this->showEnergyForm = true;
    }

    public function closeEnergyForm()
    {
        $this->showEnergyForm = false;
    }

    public function saveEnergy()
    {
        $now = now();

        EnergyEntry::create([
            'date' => $this->selectedDate,
            'level' => $this->energyLevel,
            'time' => $now->format('H:i'),
            'timestamp' => $now->timestamp,
            'comment' => $this->energyComment ?: null,
        ]);

        $this->showEnergyForm = false;
        $this->energyLevel = 3;
        $this->energyComment = '';
    }

    public function deleteEnergy(string $id)
    {
        EnergyEntry::where('id', $id)->delete();
    }

    public function render()
    {
        $moodEntries = MoodEntry::whereDate('date', $this->selectedDate)
            ->with(['reflection', 'relationships'])
            ->orderByDesc('timestamp')
            ->get();

        $energyEntries = EnergyEntry::whereDate('date', $this->selectedDate)
            ->orderByDesc('timestamp')
            ->get();

        $avgEnergy = $energyEntries->avg('level');

        return view('livewire.mood.mood-tracker', [
            'moodEntries' => $moodEntries,
            'energyEntries' => $energyEntries,
            'moodStates' => $this->moodLogger()->catalog(),
            'prioritizedStates' => $this->moodLogger()->prioritizedStates(),
            'avgEnergy' => $avgEnergy,
            ...$this->moodProgressiveData(),
        ]);
    }
}
