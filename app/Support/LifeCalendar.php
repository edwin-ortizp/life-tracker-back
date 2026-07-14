<?php

namespace App\Support;

use App\Models\User;
use Carbon\Carbon;

class LifeCalendar
{
    /** @return array{start: Carbon, end: Carbon}|null */
    public static function boundsFor(User $user): ?array
    {
        if (! $user->birth_date || ! $user->life_expectancy_years) {
            return null;
        }

        $birthDate = $user->birth_date->copy()->startOfDay();

        return [
            'start' => $birthDate->copy()->startOfWeek(Carbon::MONDAY),
            'end' => $birthDate->copy()->addYears((int) $user->life_expectancy_years)->startOfWeek(Carbon::MONDAY),
        ];
    }

    public static function weekStart(string $week): ?Carbon
    {
        if (! preg_match('/^(\d{4})-W(\d{2})$/', $week, $matches)) {
            return null;
        }

        $year = (int) $matches[1];
        $weekNumber = (int) $matches[2];
        $weeksInYear = Carbon::create($year, 12, 28)->isoWeek;

        if ($weekNumber < 1 || $weekNumber > $weeksInYear) {
            return null;
        }

        return Carbon::create($year, 1, 4)->setISODate($year, $weekNumber, Carbon::MONDAY)->startOfDay();
    }
}
