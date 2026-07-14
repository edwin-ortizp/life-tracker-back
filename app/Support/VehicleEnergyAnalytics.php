<?php

namespace App\Support;

use App\Models\Vehicle;
use App\Models\VehicleEnergyLog;
use Illuminate\Support\Collection;

class VehicleEnergyAnalytics
{
    private const LITERS_PER_GALLON = 3.78541;

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
                ? self::convertVolume((float) $log->quantity, $log->unit, $displayUnit)
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
            if ($price !== null) $previousPrice = $price;
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
            if ($distance <= 0) continue;

            $fuel = $logs->filter(function (VehicleEnergyLog $log) use ($start, $end) {
                return self::isAfter($log, $start) && !self::isAfter($log, $end);
            })->sum('display_quantity');
            if ($fuel <= 0) continue;

            $latest = ['distance' => $distance, 'fuel' => (float) $fuel, 'efficiency' => $distance / $fuel, 'end_log' => $end];
        }

        return $latest;
    }

    private static function isAfter(VehicleEnergyLog $left, VehicleEnergyLog $right): bool
    {
        if ($left->recorded_on->gt($right->recorded_on)) return true;
        if ($left->recorded_on->lt($right->recorded_on)) return false;
        return $left->created_at->gt($right->created_at);
    }

    private static function convertVolume(float $quantity, string $from, string $to): float
    {
        if ($from === $to) return $quantity;
        if ($from === 'L' && $to === 'gal') return $quantity / self::LITERS_PER_GALLON;
        if ($from === 'gal' && $to === 'L') return $quantity * self::LITERS_PER_GALLON;
        return $quantity;
    }
}
