<?php

namespace App\Livewire\Journal;

use App\Models\JournalEntry;
use App\Support\LifeCalendar;
use Carbon\Carbon;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Diario: Vida')]
class JournalLifeCalendar extends Component
{
    public function render()
    {
        $user = auth()->user();
        $bounds = $user ? LifeCalendar::boundsFor($user) : null;

        if (! $bounds) {
            return view('livewire.journal.journal-life-calendar', ['isConfigured' => false]);
        }

        $weekCells = $this->buildWeekCells($bounds);
        $currentWeek = now()->startOfWeek(Carbon::MONDAY);
        $totalWeeks = (int) $bounds['start']->diffInWeeks($bounds['end']) + 1;
        $lastLivedWeek = $currentWeek->lt($bounds['start']) ? $bounds['start']->copy()->subWeek() : $currentWeek->min($bounds['end']);
        $livedWeeks = $lastLivedWeek->lt($bounds['start']) ? 0 : (int) $bounds['start']->diffInWeeks($lastLivedWeek) + 1;

        return view('livewire.journal.journal-life-calendar', [
            'isConfigured' => true,
            'weekRows' => collect($weekCells)->groupBy(fn (array $cell) => $cell['iso_year']),
            'currentYear' => now()->isoWeekYear,
            'totalWeeks' => $totalWeeks,
            'livedWeeks' => $livedWeeks,
            'remainingWeeks' => $totalWeeks - $livedWeeks,
        ]);
    }

    /** @return array<int, array{key: string, iso_year: int, start: Carbon, end: Carbon, entries_count: int, is_future: bool, is_current: bool}> */
    private function buildWeekCells(array $bounds): array
    {
        $entriesByWeek = JournalEntry::whereBetween('date', [
            $bounds['start']->toDateString(),
            $bounds['end']->copy()->endOfWeek(Carbon::SUNDAY)->toDateString(),
        ])->get()->countBy(fn (JournalEntry $entry) => sprintf('%d-W%02d', $entry->date->isoWeekYear, $entry->date->isoWeek));

        $currentWeek = now()->startOfWeek(Carbon::MONDAY);
        $cells = [];
        $cursor = $bounds['start']->copy();

        while ($cursor->lte($bounds['end'])) {
            $key = sprintf('%d-W%02d', $cursor->isoWeekYear, $cursor->isoWeek);
            $cells[] = [
                'key' => $key,
                'iso_year' => $cursor->isoWeekYear,
                'start' => $cursor->copy(),
                'end' => $cursor->copy()->endOfWeek(Carbon::SUNDAY),
                'entries_count' => $entriesByWeek->get($key, 0),
                'is_future' => $cursor->gt($currentWeek),
                'is_current' => $cursor->equalTo($currentWeek),
            ];
            $cursor->addWeek();
        }

        return $cells;
    }
}
