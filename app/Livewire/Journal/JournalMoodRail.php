<?php

namespace App\Livewire\Journal;

use App\Livewire\Concerns\LogsMoodProgressively;
use App\Models\EnergyEntry;
use App\Models\MoodEntry;
use Livewire\Component;

class JournalMoodRail extends Component
{
    use LogsMoodProgressively;

    public string $selectedDate;

    public int $energyLevel = 3;

    public string $energyComment = '';

    /** Same one-tap write as Ánimo and Inicio, through the shared logger. */
    public function saveMood(string $moodStateId): void
    {
        $this->logMood($moodStateId);
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
            'moodStates' => $this->moodLogger()->prioritizedStates(),
            'lastMood' => MoodEntry::whereDate('date', $this->selectedDate)->latest('timestamp')->first(),
            'lastEnergy' => EnergyEntry::whereDate('date', $this->selectedDate)->latest('timestamp')->first(),
            ...$this->moodProgressiveData(),
        ]);
    }
}
