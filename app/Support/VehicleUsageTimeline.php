<?php

namespace App\Support;

use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Support\Collection;

final class VehicleUsageTimeline
{
    public static function entries(Vehicle $vehicle): Collection
    {
        $entries = collect();

        if ($vehicle->manual_usage_reading !== null && $vehicle->manual_usage_recorded_at !== null) {
            $entries->push(self::entry('manual', $vehicle->id, $vehicle->manual_usage_recorded_at->toDateString(), $vehicle->manual_usage_recorded_at, (float) $vehicle->manual_usage_reading, 'contador manual'));
        }

        $vehicle->energyLogs()->whereNotNull('usage_reading')->get()->each(function ($log) use ($entries): void {
            $entries->push(self::entry('energy', $log->id, $log->recorded_on, $log->created_at, (float) $log->usage_reading, 'combustible/carga'));
        });
        $vehicle->maintenanceLogs()->whereNotNull('usage_reading')->get()->each(function ($log) use ($entries): void {
            $entries->push(self::entry('maintenance', $log->id, $log->performed_on, $log->created_at, (float) $log->usage_reading, 'mantenimiento'));
        });

        return $entries->sortBy('sort_key')->values();
    }

    public static function conflict(Vehicle $vehicle, string $date, float $reading, string $source, ?string $id = null, mixed $createdAt = null): ?string
    {
        $candidate = self::entry($source, $id ?? 'new', $date, $createdAt ? Carbon::parse($createdAt) : now(), $reading, 'registro actual');
        $entries = collect();

        if ($vehicle->manual_usage_reading !== null && $vehicle->manual_usage_recorded_at !== null) {
            $entries->push(self::entry('manual', $vehicle->id, $vehicle->manual_usage_recorded_at->toDateString(), $vehicle->manual_usage_recorded_at, (float) $vehicle->manual_usage_reading, 'contador manual'));
        }

        self::nearestEnergyEntries($vehicle, $candidate, $source === 'energy' ? $id : null)->each(fn (array $entry) => $entries->push($entry));
        self::nearestMaintenanceEntries($vehicle, $candidate, $source === 'maintenance' ? $id : null)->each(fn (array $entry) => $entries->push($entry));
        $entries = $entries->reject(fn (array $entry) => $entry['source'] === $source && $entry['id'] === $id)->sortBy('sort_key')->values();

        $previous = $entries->filter(fn (array $entry) => $entry['sort_key'] <= $candidate['sort_key'])->last();
        if ($previous && $previous['reading'] > $reading) {
            return sprintf('La lectura no puede ser menor que %s del %s (%s).', self::formatReading($previous['reading']), $previous['date']->format('d/m/Y'), $previous['label']);
        }

        $next = $entries->first(fn (array $entry) => $entry['sort_key'] > $candidate['sort_key']);
        if ($next && $next['reading'] < $reading) {
            return sprintf('La lectura no puede ser mayor que %s del %s (%s).', self::formatReading($next['reading']), $next['date']->format('d/m/Y'), $next['label']);
        }

        return null;
    }

    public static function recalculateCurrentUsage(Vehicle $vehicle): void
    {
        $maximum = collect([
            $vehicle->manual_usage_reading,
            $vehicle->energyLogs()->max('usage_reading'),
            $vehicle->maintenanceLogs()->max('usage_reading'),
        ])->filter(fn ($value) => $value !== null)->max();
        $vehicle->update(['current_usage' => $maximum === null ? null : round((float) $maximum, 2)]);
    }

    private static function nearestEnergyEntries(Vehicle $vehicle, array $candidate, ?string $excludedId): Collection
    {
        $base = $vehicle->energyLogs()->whereNotNull('usage_reading')
            ->when($excludedId, fn ($query) => $query->whereKeyNot($excludedId));

        $previous = (clone $base)->where(function ($query) use ($candidate): void {
            $query->whereDate('recorded_on', '<', $candidate['date'])
                ->orWhere(function ($query) use ($candidate): void {
                    $query->whereDate('recorded_on', $candidate['date'])->where('created_at', '<=', $candidate['created_at']);
                });
        })->orderByDesc('recorded_on')->orderByDesc('created_at')->first();
        $next = (clone $base)->where(function ($query) use ($candidate): void {
            $query->whereDate('recorded_on', '>', $candidate['date'])
                ->orWhere(function ($query) use ($candidate): void {
                    $query->whereDate('recorded_on', $candidate['date'])->where('created_at', '>', $candidate['created_at']);
                });
        })->orderBy('recorded_on')->orderBy('created_at')->first();

        return collect([$previous, $next])->filter()->unique('id')->map(fn ($log) => self::entry('energy', $log->id, $log->recorded_on, $log->created_at, (float) $log->usage_reading, 'combustible/carga'));
    }

    private static function nearestMaintenanceEntries(Vehicle $vehicle, array $candidate, ?string $excludedId): Collection
    {
        $base = $vehicle->maintenanceLogs()->whereNotNull('usage_reading')
            ->when($excludedId, fn ($query) => $query->whereKeyNot($excludedId));

        $previous = (clone $base)->where(function ($query) use ($candidate): void {
            $query->whereDate('performed_on', '<', $candidate['date'])
                ->orWhere(function ($query) use ($candidate): void {
                    $query->whereDate('performed_on', $candidate['date'])->where('created_at', '<=', $candidate['created_at']);
                });
        })->orderByDesc('performed_on')->orderByDesc('created_at')->first();
        $next = (clone $base)->where(function ($query) use ($candidate): void {
            $query->whereDate('performed_on', '>', $candidate['date'])
                ->orWhere(function ($query) use ($candidate): void {
                    $query->whereDate('performed_on', $candidate['date'])->where('created_at', '>', $candidate['created_at']);
                });
        })->orderBy('performed_on')->orderBy('created_at')->first();

        return collect([$previous, $next])->filter()->unique('id')->map(fn ($log) => self::entry('maintenance', $log->id, $log->performed_on, $log->created_at, (float) $log->usage_reading, 'mantenimiento'));
    }

    private static function entry(string $source, string $id, mixed $date, mixed $createdAt, float $reading, string $label): array
    {
        $date = Carbon::parse($date)->startOfDay();
        $createdAt = Carbon::parse($createdAt);

        return [
            'source' => $source,
            'id' => $id,
            'date' => $date,
            'created_at' => $createdAt,
            'reading' => $reading,
            'label' => $label,
            'sort_key' => $date->format('Y-m-d').' '.$createdAt->format('H:i:s.u').' '.$source.' '.$id,
        ];
    }

    private static function formatReading(float $reading): string
    {
        return number_format($reading, 2, ',', '.');
    }
}
