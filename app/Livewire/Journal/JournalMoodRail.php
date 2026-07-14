<?php

namespace App\Livewire\Journal;

use App\Models\EnergyEntry;
use App\Models\MoodEntry;
use App\Models\MoodState;
use Livewire\Component;

class JournalMoodRail extends Component
{
    public string $selectedDate;
    public int $energyLevel = 3;
    public string $energyComment = '';

    public function saveMood(string $moodStateId): void
    {
        $state = MoodState::find($moodStateId);
        if (! $state) return;
        $now = now();
        MoodEntry::create(['date' => $this->selectedDate, 'emoji' => $state->emoji, 'text' => $state->text, 'value' => $state->value, 'time' => $now->format('H:i'), 'timestamp' => $now->timestamp, 'mood_state_id' => $state->id]);
    }

    public function saveEnergy(): void
    {
        $data = $this->validate(['energyLevel' => ['required', 'integer', 'between:1,5'], 'energyComment' => ['nullable', 'string', 'max:500']]);
        $now = now();
        EnergyEntry::create(['date' => $this->selectedDate, 'level' => $data['energyLevel'], 'comment' => trim($data['energyComment']) ?: null, 'time' => $now->format('H:i'), 'timestamp' => $now->timestamp]);
        $this->energyComment = '';
    }

    public function render()
    {
        return view('livewire.journal.journal-mood-rail', [
            'moodStates' => MoodState::orderByDesc('value')->get(),
            'lastMood' => MoodEntry::whereDate('date', $this->selectedDate)->latest('timestamp')->first(),
            'lastEnergy' => EnergyEntry::whereDate('date', $this->selectedDate)->latest('timestamp')->first(),
        ]);
    }
}
