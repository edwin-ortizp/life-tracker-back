<?php

namespace App\Livewire\Journal;

use App\Models\JournalEntry;
use App\Support\LifeCalendar;
use Carbon\Carbon;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Diario: Semana de vida')]
class JournalLifeWeek extends Component
{
    #[Url(as: 'week', history: true, keep: true)]
    public string $week = '';

    public function render()
    {
        $user = auth()->user();
        $bounds = $user ? LifeCalendar::boundsFor($user) : null;
        $weekStart = LifeCalendar::weekStart($this->week);
        $isAvailable = $bounds && $weekStart && $weekStart->betweenIncluded($bounds['start'], $bounds['end']) && $weekStart->lte(now()->startOfWeek(Carbon::MONDAY));

        if (! $isAvailable) {
            return view('livewire.journal.journal-life-week', ['isAvailable' => false]);
        }

        $days = collect(range(0, 6))->map(fn (int $offset) => $weekStart->copy()->addDays($offset));
        $entries = JournalEntry::whereBetween('date', [$days->first()->toDateString(), $days->last()->toDateString()])
            ->get()
            ->keyBy(fn (JournalEntry $entry) => $entry->date->toDateString());

        return view('livewire.journal.journal-life-week', [
            'isAvailable' => true,
            'weekStart' => $weekStart,
            'weekEnd' => $weekStart->copy()->endOfWeek(Carbon::SUNDAY),
            'days' => $days,
            'entries' => $entries,
        ]);
    }
}
