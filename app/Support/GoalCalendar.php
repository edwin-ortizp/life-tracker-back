<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

/**
 * Calendario mensual y racha de una meta diaria (hidratación, minutos activos…).
 * Recibe los totales por fecha (`Y-m-d` => total) ya calculados por cada módulo.
 */
class GoalCalendar
{
    /**
     * Límites de la cuadrícula del mes (de lunes a domingo completos).
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    public static function gridBounds(Carbon $selected, ?Carbon $monthStart = null): array
    {
        $month = ($monthStart ?? $selected)->copy()->startOfMonth();

        return [$month->copy()->startOfWeek(Carbon::MONDAY), $month->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY)];
    }

    public static function month(Collection $totals, Carbon $selected, int $goal, ?Carbon $monthStart = null): array
    {
        $month = ($monthStart ?? $selected)->copy()->startOfMonth();
        [$gridStart, $gridEnd] = self::gridBounds($selected, $monthStart);

        $days = collect(CarbonPeriod::create($gridStart, $gridEnd))->map(function (Carbon $date) use ($month, $selected, $totals, $goal) {
            $total = (int) ($totals[$date->toDateString()] ?? 0);

            return [
                'date' => $date->copy(),
                'total' => $total,
                'percentage' => $goal > 0 ? min((int) round(($total / $goal) * 100), 100) : 0,
                'raw_percentage' => $goal > 0 ? (int) round(($total / $goal) * 100) : 0,
                'has_data' => $total > 0,
                'future' => $date->gt(today()),
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

    /**
     * Días consecutivos cumpliendo al menos el 100 % de la meta.
     * Cuenta hacia atrás desde ayer; hoy suma solo si ya alcanzó la meta y, si aún no, no rompe la racha.
     */
    public static function streak(Collection $totals, int $goal, ?Carbon $today = null): int
    {
        if ($goal <= 0) {
            return 0;
        }

        $today = ($today ?? today())->copy()->startOfDay();
        $streak = ($totals[$today->toDateString()] ?? 0) >= $goal ? 1 : 0;

        for ($day = $today->copy()->subDay(); ($totals[$day->toDateString()] ?? 0) >= $goal; $day->subDay()) {
            $streak++;
        }

        return $streak;
    }
}
