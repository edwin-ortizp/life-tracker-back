<?php

namespace App\Livewire\Vehicle\Concerns;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Periodos compartidos por los historiales del vehículo. Un periodo vacío equivale a todo el historial.
 */
trait FiltersByPeriod
{
    /** @return array<string, string> */
    public static function periodOptions(): array
    {
        return ['1m' => 'Último mes', '3m' => 'Últimos 3 meses', '1y' => 'Último año', 'year' => 'Este año'];
    }

    protected function periodStart(string $period): ?CarbonImmutable
    {
        $today = CarbonImmutable::today();

        return match ($period) {
            '1m' => $today->subMonth(),
            '3m' => $today->subMonths(3),
            '1y' => $today->subYear(),
            'year' => $today->startOfYear(),
            default => null,
        };
    }

    protected function applyPeriod(Builder $query, string $column, string $period): Builder
    {
        $start = $this->periodStart($period);

        return $query->when($start, fn (Builder $filtered) => $filtered->whereDate($column, '>=', $start->toDateString()));
    }
}
