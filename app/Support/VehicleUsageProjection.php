<?php

namespace App\Support;

use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Support\Collection;

final class VehicleUsageProjection
{
    public static function rateForVehicle(Vehicle $vehicle, ?Carbon $today = null): ?array
    {
        $today ??= today();
        $recent = self::entriesBetween($vehicle, $today->copy()->subDays(90), $today);

        return self::rateFrom(self::dailyEntries($recent), '90_dias')
            ?? self::rateFrom(self::historicalExtremes($vehicle, $today), 'historial');
    }

    public static function forDueUsage(Vehicle $vehicle, ?float $dueUsage, ?Carbon $today = null): ?array
    {
        if ($dueUsage === null) {
            return null;
        }

        return self::forDueUsageUsingRate(self::rateForVehicle($vehicle, $today), $dueUsage);
    }

    public static function forDueUsageUsingRate(?array $rate, ?float $dueUsage): ?array
    {
        if ($dueUsage === null || ! $rate || ! isset($rate['daily_rate'], $rate['end_reading'], $rate['end_date'])) {
            return null;
        }

        $remaining = $dueUsage - $rate['end_reading'];
        $days = $remaining <= 0 ? 0 : (int) ceil($remaining / $rate['daily_rate']);

        return $rate + ['due_usage' => $dueUsage, 'projected_date' => $rate['end_date']->copy()->addDays($days)];
    }

    private static function entriesBetween(Vehicle $vehicle, Carbon $from, Carbon $to): Collection
    {
        $entries = collect();
        $vehicle->energyLogs()->whereNotNull('usage_reading')->whereBetween('recorded_on', [$from->toDateString(), $to->toDateString()])
            ->get(['id', 'recorded_on', 'created_at', 'usage_reading'])->each(fn ($log) => $entries->push(self::entry($log->recorded_on, $log->created_at, (float) $log->usage_reading)));
        $vehicle->maintenanceLogs()->whereNotNull('usage_reading')->whereBetween('performed_on', [$from->toDateString(), $to->toDateString()])
            ->get(['id', 'performed_on', 'created_at', 'usage_reading'])->each(fn ($log) => $entries->push(self::entry($log->performed_on, $log->created_at, (float) $log->usage_reading)));
        if ($vehicle->manual_usage_reading !== null && $vehicle->manual_usage_recorded_at?->betweenIncluded($from, $to)) {
            $entries->push(self::entry($vehicle->manual_usage_recorded_at, $vehicle->manual_usage_recorded_at, (float) $vehicle->manual_usage_reading));
        }

        return $entries;
    }

    private static function historicalExtremes(Vehicle $vehicle, Carbon $today): Collection
    {
        $entries = collect();
        foreach ([['energyLogs', 'recorded_on'], ['maintenanceLogs', 'performed_on']] as [$relation, $dateColumn]) {
            $base = $vehicle->{$relation}()->whereNotNull('usage_reading')->whereDate($dateColumn, '<=', $today);
            foreach ([(clone $base)->orderBy($dateColumn)->orderBy('created_at')->first(), (clone $base)->orderByDesc($dateColumn)->orderByDesc('created_at')->first()] as $log) {
                if ($log) {
                    $entries->push(self::entry($log->{$dateColumn}, $log->created_at, (float) $log->usage_reading));
                }
            }
        }
        if ($vehicle->manual_usage_reading !== null && $vehicle->manual_usage_recorded_at?->lte($today)) {
            $entries->push(self::entry($vehicle->manual_usage_recorded_at, $vehicle->manual_usage_recorded_at, (float) $vehicle->manual_usage_reading));
        }

        return self::dailyEntries($entries);
    }

    private static function dailyEntries(Collection $entries): Collection
    {
        return $entries->groupBy(fn (array $entry) => $entry['date']->toDateString())
            ->map(fn (Collection $day) => $day->sortBy('sort_key')->last())->sortBy('date')->values();
    }

    private static function entry(mixed $date, mixed $createdAt, float $reading): array
    {
        $date = Carbon::parse($date)->startOfDay();
        $createdAt = Carbon::parse($createdAt);

        return ['date' => $date, 'reading' => $reading, 'sort_key' => $date->format('Y-m-d').' '.$createdAt->format('H:i:s.u')];
    }

    private static function rateFrom(Collection $entries, string $basis): ?array
    {
        if ($entries->count() < 2) {
            return null;
        }
        $first = $entries->first();
        $last = $entries->last();
        $days = $first['date']->diffInDays($last['date']);
        $growth = $last['reading'] - $first['reading'];
        if ($days <= 0 || $growth <= 0) {
            return null;
        }

        return [
            'daily_rate' => $growth / $days,
            'basis' => $basis,
            'start_date' => $first['date']->copy(),
            'end_date' => $last['date']->copy(),
            'start_reading' => $first['reading'],
            'end_reading' => $last['reading'],
        ];
    }
}
