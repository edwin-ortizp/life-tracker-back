<?php

namespace App\Support;

use App\Models\HabitCompletion;
use App\Models\HabitDefinition;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class HabitProgress
{
    public static function month(Carbon $selected): array
    {
        $month = $selected->copy()->startOfMonth();
        $gridStart = $month->copy()->startOfWeek(Carbon::MONDAY);
        $gridEnd = $month->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY);
        $habitIds = HabitDefinition::query()->pluck('id');
        $habitCount = $habitIds->count();
        $totals = HabitCompletion::query()
            ->whereIn('habit_id', $habitIds)
            ->where('completed', true)
            ->whereDate('date', '>=', $gridStart->toDateString())
            ->whereDate('date', '<=', $gridEnd->toDateString())
            ->selectRaw('date, COUNT(*) as total')
            ->groupBy('date')
            ->get()
            ->mapWithKeys(fn (HabitCompletion $row) => [$row->date->toDateString() => (int) $row->total]);

        $days = collect(CarbonPeriod::create($gridStart, $gridEnd))->map(function (Carbon $date) use ($habitCount, $month, $selected, $totals) {
            $completed = (int) ($totals[$date->toDateString()] ?? 0);

            return [
                'date' => $date->copy(),
                'completed' => $completed,
                'percentage' => $habitCount > 0 ? min((int) round(($completed / $habitCount) * 100), 100) : 0,
                'in_month' => $date->month === $month->month,
                'selected' => $date->isSameDay($selected),
                'today' => $date->isToday(),
            ];
        });

        return [
            'label' => $month->translatedFormat('F Y'),
            'weeks' => $days->chunk(7),
            'habit_count' => $habitCount,
            'best_streak' => self::bestCurrentStreak($habitIds),
        ];
    }

    public static function bestCurrentStreak(Collection $habitIds): int
    {
        if ($habitIds->isEmpty()) {
            return 0;
        }

        $history = HabitCompletion::query()
            ->whereIn('habit_id', $habitIds)
            ->where('completed', true)
            ->whereDate('date', '<=', today()->toDateString())
            ->get(['habit_id', 'date'])
            ->groupBy('habit_id');

        return (int) ($history->map(fn (Collection $entries) => self::currentStreak(
            $entries->mapWithKeys(fn (HabitCompletion $completion) => [$completion->date->toDateString() => true])->all(),
            today(),
        ))->max() ?? 0);
    }

    public static function currentStreak(array $completedDates, Carbon $today): int
    {
        $streak = 0;
        $date = $today->copy();

        while (isset($completedDates[$date->toDateString()])) {
            $streak++;
            $date->subDay();
        }

        return $streak;
    }
}
