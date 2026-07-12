<?php

namespace App\Livewire\Mood;

use App\Models\EnergyEntry;
use App\Models\MoodEntry;
use App\Models\MoodState;
use Carbon\Carbon;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Estado de Ánimo')]
class MoodTracker extends Component
{
    public string $selectedDate;

    // Mood form
    public string $selectedMoodStateId = '';
    public bool $showMoodForm = false;

    // Energy form
    public int $energyLevel = 3;
    public string $energyComment = '';
    public bool $showEnergyForm = false;

    public function mount()
    {
        $this->selectedDate = now()->toDateString();
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

    public function openMoodForm()
    {
        $this->selectedMoodStateId = '';
        $this->showMoodForm = true;
    }

    public function closeMoodForm()
    {
        $this->showMoodForm = false;
    }

    public function saveMood(string $moodStateId)
    {
        $moodState = MoodState::find($moodStateId);
        if (!$moodState) return;

        $now = now();

        MoodEntry::create([
            'date' => $this->selectedDate,
            'emoji' => $moodState->emoji,
            'text' => $moodState->text,
            'value' => $moodState->value,
            'time' => $now->format('H:i'),
            'timestamp' => $now->timestamp,
            'mood_state_id' => $moodStateId,
        ]);

        $this->showMoodForm = false;
    }

    public function deleteMood(string $id)
    {
        MoodEntry::where('id', $id)->delete();
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
        $moodEntries = MoodEntry::where('date', $this->selectedDate)
            ->orderByDesc('timestamp')
            ->get();

        $energyEntries = EnergyEntry::where('date', $this->selectedDate)
            ->orderByDesc('timestamp')
            ->get();

        $moodStates = MoodState::orderBy('value', 'desc')->get();

        $avgEnergy = $energyEntries->avg('level');

        return view('livewire.mood.mood-tracker', [
            'moodEntries' => $moodEntries,
            'energyEntries' => $energyEntries,
            'moodStates' => $moodStates,
            'avgEnergy' => $avgEnergy,
        ]);
    }
}
