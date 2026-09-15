<?php

namespace App\Support;

use App\Models\ExerciseLog;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ExerciseProgress
{
    public const DEFAULT_DAILY_MINUTES = 30;

    /**
     * Minutos activos por fecha (`Y-m-d` => minutos) del usuario autenticado.
     */
    public static function totals(Carbon $start, Carbon $end): Collection
    {
        return ExerciseLog::query()
            ->whereDate('date', '>=', $start->toDateString())
            ->whereDate('date', '<=', $end->toDateString())
            ->selectRaw('date, SUM(duration) as total')
            ->groupBy('date')
            ->get()
            ->mapWithKeys(fn (ExerciseLog $row) => [$row->date->toDateString() => (int) $row->total]);
    }
}
