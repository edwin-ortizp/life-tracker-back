<?php

namespace App\Support;

use App\Models\User;

class WaterGoal
{
    public const DEFAULT_MILLILITERS = 2500;

    public const MILLILITERS_PER_KILOGRAM = 35;

    public static function forUser(?User $user): int
    {
        if ($user?->daily_water_goal) {
            return $user->daily_water_goal;
        }

        return self::suggestedForWeight($user?->current_weight_kg);
    }

    public static function suggestedForWeight(?float $weightKg): int
    {
        if (! $weightKg || $weightKg <= 0) {
            return self::DEFAULT_MILLILITERS;
        }

        return (int) (round(($weightKg * self::MILLILITERS_PER_KILOGRAM) / 50) * 50);
    }
}
