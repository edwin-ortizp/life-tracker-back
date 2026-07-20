<?php

namespace App\Support;

use App\Models\Vehicle;
use App\Models\VehicleEnergyLog;
use Illuminate\Support\Collection;

class VehicleEnergyAnalytics
{
    public static function summaryForVehicle(Vehicle $vehicle): array
    {
        $displayUnit = $vehicle->power_source === 'electrico' ? 'kWh' : ($vehicle->fuel_volume_unit ?: 'gal');
        $sources = self::analysisSources($vehicle);
        $baseQuery = fn () => VehicleEnergyLog::query()->where('vehicle_id', $vehicle->id)->whereIn('energy_source', $sources);

        $latestPriced = $baseQuery()->whereNotNull('cost')->where('quantity', '>', 0)
            ->orderByDesc('recorded_on')->orderByDesc('created_at')->first();
        $latestPrice = null;
        if ($latestPriced) {
            $quantity = self::displayQuantity($latestPriced, $displayUnit);
            $latestPrice = $quantity > 0 ? (float) $latestPriced->cost / $quantity : null;
        }

        $groups = $baseQuery()->whereNotNull('cost')->where('quantity', '>', 0)
            ->selectRaw('unit, SUM(cost) as total_cost, SUM(quantity) as total_quantity')
            ->groupBy('unit')->get();
        $totalCost = (float) $groups->sum('total_cost');
        $totalQuantity = (float) $groups->sum(fn ($group) => self::convertQuantity((float) $group->total_quantity, $group->unit, $displayUnit));

        return [
            'unit' => $displayUnit,
            'latest_price' => $latestPrice,
            'weighted_average_price' => $totalQuantity > 0 ? $totalCost / $totalQuantity : null,
            'latest_efficiency' => self::latestEfficiencyFromDatabase($vehicle, $sources, $displayUnit),
        ];
    }

    public static function annotate(Collection $logs, Vehicle $vehicle): Collection
    {
        $preferredFuelUnit = $vehicle->fuel_volume_unit ?: 'gal';

        return $logs->map(function (VehicleEnergyLog $log) use ($preferredFuelUnit) {
            $isLiquid = in_array($log->energy_source, ['gasolina', 'diesel'], true);
            $displayUnit = $isLiquid ? $preferredFuelUnit : 'kWh';
            $quantity = $isLiquid ? self::displayQuantity($log, $displayUnit) : (float) $log->quantity;
            $log->setAttribute('display_quantity', $quantity);
            $log->setAttribute('display_unit', $displayUnit);
            $log->setAttribute('unit_price', $log->cost !== null && $quantity > 0 ? (float) $log->cost / $quantity : null);

            return $log;
        });
    }

    public static function forVehicle(Vehicle $vehicle): array
    {
        $logs = VehicleEnergyLog::where('vehicle_id', $vehicle->id)
            ->orderBy('recorded_on')
            ->orderBy('created_at')
            ->get();

        $preferredFuelUnit = $vehicle->fuel_volume_unit ?: 'gal';
        $fuelSources = $vehicle->power_source === 'diesel' ? ['diesel'] : ['gasolina'];
        $analysisLogs = $logs->filter(fn (VehicleEnergyLog $log) => in_array($log->energy_source, $fuelSources, true));
        if ($vehicle->power_source === 'electrico') {
            $analysisLogs = $logs->where('energy_source', 'electrico');
        }

        $annotatedLogs = $logs->map(function (VehicleEnergyLog $log) use ($preferredFuelUnit) {
            $isLiquid = in_array($log->energy_source, ['gasolina', 'diesel'], true);
            $displayUnit = $isLiquid ? $preferredFuelUnit : 'kWh';
            $quantity = $isLiquid
                ? VehicleFuelVolume::convert((float) $log->quantity, $log->unit, $displayUnit)
                : (float) $log->quantity;
            $log->setAttribute('display_quantity', $quantity);
            $log->setAttribute('display_unit', $displayUnit);
            $log->setAttribute('unit_price', $log->cost !== null && $quantity > 0 ? (float) $log->cost / $quantity : null);

            return $log;
        });

        $history = $annotatedLogs->filter(fn (VehicleEnergyLog $log) => $analysisLogs->contains('id', $log->id))->values();
        $previousPrice = null;
        $history->each(function (VehicleEnergyLog $log) use (&$previousPrice) {
            $price = $log->unit_price;
            $log->setAttribute('price_change', $price !== null && $previousPrice !== null && $previousPrice > 0
                ? (($price - $previousPrice) / $previousPrice) * 100 : null);
            if ($price !== null) {
                $previousPrice = $price;
            }
        });

        $pricedLogs = $history->filter(fn (VehicleEnergyLog $log) => $log->cost !== null && $log->display_quantity > 0);
        $totalCost = (float) $pricedLogs->sum('cost');
        $totalQuantity = (float) $pricedLogs->sum('display_quantity');

        return [
            'all_logs' => $annotatedLogs,
            'price_history' => $history,
            'unit' => $vehicle->power_source === 'electrico' ? 'kWh' : $preferredFuelUnit,
            'latest_price' => $pricedLogs->last()?->unit_price,
            'weighted_average_price' => $totalQuantity > 0 ? $totalCost / $totalQuantity : null,
            'latest_efficiency' => self::latestEfficiency($history),
        ];
    }

    private static function latestEfficiency(Collection $logs): ?array
    {
        $fullLogs = $logs->filter(fn (VehicleEnergyLog $log) => $log->is_full && $log->usage_reading !== null)->values();
        $latest = null;

        for ($index = 1; $index < $fullLogs->count(); $index++) {
            $start = $fullLogs[$index - 1];
            $end = $fullLogs[$index];
            $distance = (float) $end->usage_reading - (float) $start->usage_reading;
            if ($distance <= 0) {
                continue;
            }

            $fuel = $logs->filter(function (VehicleEnergyLog $log) use ($start, $end) {
                return self::isAfter($log, $start) && ! self::isAfter($log, $end);
            })->sum('display_quantity');
            if ($fuel <= 0) {
                continue;
            }

            $latest = ['distance' => $distance, 'fuel' => (float) $fuel, 'efficiency' => $distance / $fuel, 'end_log' => $end];
        }

        return $latest;
    }

    private static function latestEfficiencyFromDatabase(Vehicle $vehicle, array $sources, string $displayUnit): ?array
    {
        $fullLogs = VehicleEnergyLog::query()
            ->where('vehicle_id', $vehicle->id)->whereIn('energy_source', $sources)
            ->where('is_full', true)->whereNotNull('usage_reading')
            ->orderByDesc('recorded_on')->orderByDesc('created_at')->limit(2)->get()->reverse()->values();
        if ($fullLogs->count() < 2) {
            return null;
        }
        [$start, $end] = [$fullLogs[0], $fullLogs[1]];
        $distance = (float) $end->usage_reading - (float) $start->usage_reading;
        if ($distance <= 0) {
            return null;
        }

        $groups = VehicleEnergyLog::query()
            ->where('vehicle_id', $vehicle->id)->whereIn('energy_source', $sources)
            ->where(function ($query) use ($start) {
                $query->where('recorded_on', '>', $start->recorded_on)
                    ->orWhere(fn ($sameDate) => $sameDate->whereDate('recorded_on', $start->recorded_on)->where('created_at', '>', $start->created_at));
            })
            ->where(function ($query) use ($end) {
                $query->where('recorded_on', '<', $end->recorded_on)
                    ->orWhere(fn ($sameDate) => $sameDate->whereDate('recorded_on', $end->recorded_on)->where('created_at', '<=', $end->created_at));
            })
            ->selectRaw('unit, SUM(quantity) as total_quantity')->groupBy('unit')->get();
        $fuel = (float) $groups->sum(fn ($group) => self::convertQuantity((float) $group->total_quantity, $group->unit, $displayUnit));
        if ($fuel <= 0) {
            return null;
        }

        return ['distance' => $distance, 'fuel' => $fuel, 'efficiency' => $distance / $fuel, 'end_log' => $end];
    }

    private static function analysisSources(Vehicle $vehicle): array
    {
        return match ($vehicle->power_source) {
            'diesel' => ['diesel'],
            'electrico' => ['electrico'],
            default => ['gasolina'],
        };
    }

    private static function displayQuantity(VehicleEnergyLog $log, string $displayUnit): float
    {
        return self::convertQuantity((float) $log->quantity, $log->unit, $displayUnit);
    }

    private static function convertQuantity(float $quantity, string $from, string $to): float
    {
        return in_array($from, ['gal', 'L'], true) ? VehicleFuelVolume::convert($quantity, $from, $to) : $quantity;
    }

    private static function isAfter(VehicleEnergyLog $left, VehicleEnergyLog $right): bool
    {
        if ($left->recorded_on->gt($right->recorded_on)) {
            return true;
        }
        if ($left->recorded_on->lt($right->recorded_on)) {
            return false;
        }

        return $left->created_at->gt($right->created_at);
    }
}
