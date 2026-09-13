<?php

namespace App\Livewire\Exercise;

use App\Models\ExerciseLog;
use Carbon\Carbon;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Estadísticas de ejercicio')]
class ExerciseStatistics extends Component
{
    public const PERIODS = [7 => '7 días', 30 => '30 días', 90 => '90 días'];

    #[Url(as: 'periodo', history: true)]
    public int $days = 30;

    public function mount(): void
    {
        if (! array_key_exists($this->days, self::PERIODS)) {
            $this->days = 30;
        }
    }

    public function updatedDays(): void
    {
        $this->mount();
    }

    public function render()
    {
        $end = now()->startOfDay();
        $start = $end->copy()->subDays($this->days - 1);

        $logs = ExerciseLog::whereDate('date', '>=', $start->toDateString())
            ->whereDate('date', '<=', $end->toDateString())
            ->with('exerciseType')
            ->get();

        $minutesByDate = $logs->groupBy(fn (ExerciseLog $log) => $log->date->toDateString())
            ->map(fn ($group) => (int) $group->sum('duration'));

        // 90 días se agrupan por semana para que las barras sigan siendo legibles.
        $series = $this->days > 30
            ? $this->weeklySeries($start, $end, $minutesByDate)
            : collect(range(0, $this->days - 1))->map(function (int $offset) use ($start, $minutesByDate) {
                $date = $start->copy()->addDays($offset);

                return [
                    'label' => $date->format('d'),
                    'title' => $date->translatedFormat('D d M'),
                    'value' => $minutesByDate[$date->toDateString()] ?? 0,
                ];
            });

        $totalMinutes = (int) $logs->sum('duration');

        $byType = $logs->groupBy(fn (ExerciseLog $log) => $log->exerciseType?->name ?? 'Ejercicio')
            ->map(fn ($group, $name) => [
                'name' => $name,
                'icon' => $group->first()->exerciseType?->icon ?? '🏃',
                'sessions' => $group->count(),
                'minutes' => (int) $group->sum('duration'),
                'calories' => (int) $group->sum('calories'),
            ])
            ->sortByDesc(fn ($row) => [$row['minutes'], $row['sessions']])
            ->values();

        $records = $logs->groupBy('exercise_type_id')
            ->map(function ($group) {
                $best = $group->sortByDesc(fn ($log) => [(float) $log->weight, (float) $log->distance, (int) $log->duration])->first();
                $detail = collect([
                    $best->weight ? rtrim(rtrim(number_format((float) $best->weight, 2, ',', ''), '0'), ',').' kg' : null,
                    $best->sets && $best->reps ? $best->sets.'×'.$best->reps : null,
                    $best->distance ? rtrim(rtrim(number_format((float) $best->distance, 2, ',', ''), '0'), ',').' km' : null,
                    $best->duration ? $best->duration.' min' : null,
                ])->filter()->implode(' · ');

                return [
                    'name' => $best->exerciseType?->name ?? 'Ejercicio',
                    'icon' => $best->exerciseType?->icon ?? '🏃',
                    'detail' => $detail,
                    'date' => $best->date,
                ];
            })
            ->filter(fn ($record) => $record['detail'] !== '')
            ->take(5)
            ->values();

        $activeDays = $minutesByDate->count();

        return view('livewire.exercise.exercise-statistics', [
            'periods' => self::PERIODS,
            'start' => $start,
            'end' => $end,
            'hasLogs' => $logs->isNotEmpty(),
            'sessions' => $logs->count(),
            'activeDays' => $activeDays,
            'totalMinutes' => $totalMinutes,
            'totalCalories' => (int) $logs->sum('calories'),
            'sessionsPerWeek' => round($logs->count() / ($this->days / 7), 1),
            'streak' => $this->currentStreak(),
            'series' => $series,
            'maxMinutes' => max($series->max('value') ?? 0, 1),
            'byType' => $byType,
            'records' => $records,
        ]);
    }

    private function weeklySeries(Carbon $start, Carbon $end, $minutesByDate)
    {
        $weeks = collect();

        for ($cursor = $start->copy(); $cursor->lte($end); $cursor->addDays(7)) {
            $weekEnd = $cursor->copy()->addDays(6)->min($end);
            $value = $minutesByDate->filter(fn ($minutes, $date) => $date >= $cursor->toDateString() && $date <= $weekEnd->toDateString())->sum();

            $weeks->push([
                'label' => $cursor->format('d/m'),
                'title' => $cursor->translatedFormat('d M').' – '.$weekEnd->translatedFormat('d M'),
                'value' => (int) $value,
            ]);
        }

        return $weeks;
    }

    /** Días consecutivos con actividad terminando hoy (o ayer, si hoy aún no hay registro). */
    private function currentStreak(): int
    {
        $dates = ExerciseLog::where('date', '>=', now()->subYear()->toDateString())
            ->distinct()
            ->orderByDesc('date')
            ->pluck('date')
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->flip();

        $cursor = now()->startOfDay();

        if (! isset($dates[$cursor->toDateString()])) {
            $cursor->subDay();
        }

        $streak = 0;

        while (isset($dates[$cursor->toDateString()])) {
            $streak++;
            $cursor->subDay();
        }

        return $streak;
    }
}
