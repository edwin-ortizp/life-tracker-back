<?php

namespace App\Livewire\Journal;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\JournalEntry;
use Carbon\Carbon;
use Livewire\Component;
use App\Livewire\Concerns\WithManagementCard;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Diario')]
class JournalEntries extends Component
{
    use HasUrlDate;
    use WithManagementCard;
    public string $text = '';
    public string $summary = '';
    public bool $isEditing = false;
    public string $viewMode = 'write'; // write, preview

    public function mount()
    {
        $this->initializeSelectedDate();
        $this->loadEntry();
    }

    public function previousDay()
    {
        $this->saveIfChanged();
        $this->selectedDate = Carbon::parse($this->selectedDate)->subDay()->toDateString();
        $this->loadEntry();
    }

    public function nextDay()
    {
        $this->saveIfChanged();
        $this->selectedDate = Carbon::parse($this->selectedDate)->addDay()->toDateString();
        $this->loadEntry();
    }

    public function today()
    {
        $this->saveIfChanged();
        $this->selectedDate = now()->toDateString();
        $this->loadEntry();
    }

    public function loadEntry()
    {
        $entry = JournalEntry::whereDate('date', $this->selectedDate)->first();
        $this->text = $entry?->text ?? '';
        $this->summary = $entry?->summary ?? '';
        $this->isEditing = false;
        $this->viewMode = 'write';
    }

    public function startEditing()
    {
        $this->isEditing = true;
    }

    public function save()
    {
        $this->summary = trim($this->summary);
        $this->validate(['summary' => ['nullable', 'string', 'max:255']], [], ['summary' => 'resumen']);

        $entry = JournalEntry::whereDate('date', $this->selectedDate)->first();

        if (empty(trim($this->text))) {
            if ($entry) {
                $entry->delete();
            }
            $this->isEditing = false;
            return;
        }

        if ($entry) {
            $entry->update([
                'text' => $this->text,
                'summary' => $this->summary !== '' ? $this->summary : null,
                'display_time' => now()->format('H:i'),
            ]);
        } else {
            JournalEntry::create([
                'date' => $this->selectedDate,
                'text' => $this->text,
                'summary' => $this->summary !== '' ? $this->summary : null,
                'display_time' => now()->format('H:i'),
            ]);
        }

        $this->isEditing = false;
    }

    private function saveIfChanged()
    {
        $entry = JournalEntry::whereDate('date', $this->selectedDate)->first();
        $currentText = $entry?->text ?? '';
        $currentSummary = $entry?->summary ?? '';

        if (($this->text !== $currentText || trim($this->summary) !== $currentSummary) && !empty(trim($this->text))) {
            $this->save();
        }
    }

    public function render()
    {
        $recentEntries = JournalEntry::orderByDesc('date')
            ->paginate($this->perPage());

        $hasEntry = !empty(trim($this->text));

        return view('livewire.journal.journal-entries', [
            'recentEntries' => $recentEntries,
            'hasEntry' => $hasEntry,
        ]);
    }
}
