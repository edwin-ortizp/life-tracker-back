<?php

namespace App\Support;

final class VehicleFuelVolume
{
    public const LITERS_PER_GALLON = 3.78541;

    public static function convert(float $quantity, string $from, string $to): float
    {
        if ($from === $to) {
            return $quantity;
        }
        if ($from === 'L' && $to === 'gal') {
            return $quantity / self::LITERS_PER_GALLON;
        }
        if ($from === 'gal' && $to === 'L') {
            return $quantity * self::LITERS_PER_GALLON;
        }

        return $quantity;
    }
}
