<?php

namespace App\Support;

use App\Models\DrinkLog;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class WaterProgress
{
    public static function totals(Carbon $start, Carbon $end): Collection
    {
        return DrinkLog::query()
            ->whereDate('date', '>=', $start->toDateString())
            ->whereDate('date', '<=', $end->toDateString())
            ->selectRaw('date, SUM(hydration_value) as total')
            ->groupBy('date')
            ->get()
            ->mapWithKeys(fn (DrinkLog $row) => [$row->date->toDateString() => (int) $row->total]);
    }

    public static function month(Carbon $selected, int $goal): array
    {
        $month = $selected->copy()->startOfMonth();
        $gridStart = $month->copy()->startOfWeek(Carbon::MONDAY);
        $gridEnd = $month->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY);
        $totals = self::totals($gridStart, $gridEnd);
        $days = collect(CarbonPeriod::create($gridStart, $gridEnd))->map(function (Carbon $date) use ($month, $selected, $totals, $goal) {
            $total = (int) ($totals[$date->toDateString()] ?? 0);

            return [
                'date' => $date->copy(),
                'total' => $total,
                'percentage' => $goal > 0 ? min((int) round(($total / $goal) * 100), 100) : 0,
                'completed' => $goal > 0 && $total >= $goal,
                'in_month' => $date->month === $month->month,
                'selected' => $date->isSameDay($selected),
                'today' => $date->isToday(),
            ];
        });
        $monthDays = $days->where('in_month', true);

        return [
            'label' => $month->translatedFormat('F Y'),
            'weeks' => $days->chunk(7),
            'tracked_days' => $monthDays->where('total', '>', 0)->count(),
            'completed_days' => $monthDays->where('completed', true)->count(),
            'average' => (int) round($monthDays->avg('total') ?? 0),
        ];
    }

    public static function week(Carbon $selected, int $goal): array
    {
        $start = $selected->copy()->startOfWeek(Carbon::MONDAY);
        $end = $start->copy()->endOfWeek(Carbon::SUNDAY);
        $totals = self::totals($start, $end);
        $days = collect(CarbonPeriod::create($start, $end))->map(function (Carbon $date) use ($totals, $goal) {
            $total = (int) ($totals[$date->toDateString()] ?? 0);

            return [
                'date' => $date->copy(),
                'total' => $total,
                'percentage' => $goal > 0 ? min((int) round(($total / $goal) * 100), 100) : 0,
                'completed' => $goal > 0 && $total >= $goal,
            ];
        });

        return [
            'start' => $start,
            'end' => $end,
            'days' => $days,
            'total' => $days->sum('total'),
            'average' => (int) round($days->avg('total') ?? 0),
            'completed_days' => $days->where('completed', true)->count(),
        ];
    }

    public static function range(Carbon $end, int $days, int $goal): array
    {
        $start = $end->copy()->subDays($days - 1)->startOfDay();
        $totals = self::totals($start, $end);
        $series = collect(CarbonPeriod::create($start, $end))->map(function (Carbon $date) use ($totals, $goal) {
            $total = (int) ($totals[$date->toDateString()] ?? 0);

            return ['date' => $date->copy(), 'total' => $total, 'completed' => $goal > 0 && $total >= $goal];
        });

        return [
            'start' => $start,
            'end' => $end,
            'series' => $series,
            'total' => $series->sum('total'),
            'average' => (int) round($series->avg('total') ?? 0),
            'tracked_days' => $series->where('total', '>', 0)->count(),
            'completed_days' => $series->where('completed', true)->count(),
            'best' => $series->sortByDesc('total')->first(),
        ];
    }
}
