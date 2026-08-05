<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * Birthdays are recurring facts derived from the profile, never persisted events.
 * A stored 29 February keeps its date but is celebrated on 28 February when the
 * upcoming year is not a leap year.
 */
final class Birthday
{
    private function __construct(
        public readonly int $month,
        public readonly int $day,
        public readonly ?int $year,
    ) {
    }

    public static function make(?int $month, ?int $day, ?int $year = null): ?self
    {
        if (! $month || ! $day) {
            return null;
        }

        if (! self::isValidCombination($month, $day)) {
            return null;
        }

        if ($year !== null && ! checkdate($month, $day, $year)) {
            return null;
        }

        return new self($month, $day, $year);
    }

    /** February 29 is accepted even though it only exists on leap years. */
    public static function isValidCombination(int $month, int $day): bool
    {
        if ($month < 1 || $month > 12 || $day < 1) {
            return false;
        }

        return checkdate($month, $day, 2024);
    }

    /** The next celebration on or after the reference date. */
    public function nextOccurrence(?Carbon $reference = null): Carbon
    {
        $today = ($reference ?? Carbon::today())->copy()->startOfDay();
        $thisYear = $this->occurrenceIn($today->year);

        return $thisYear->gte($today) ? $thisYear : $this->occurrenceIn($today->year + 1);
    }

    /** The celebration date for a given calendar year, folding 29/02 back to 28/02. */
    public function occurrenceIn(int $year): Carbon
    {
        if ($this->month === 2 && $this->day === 29 && ! Carbon::create($year, 1, 1)->isLeapYear()) {
            return Carbon::create($year, 2, 28)->startOfDay();
        }

        return Carbon::create($year, $this->month, $this->day)->startOfDay();
    }

    public function isToday(?Carbon $reference = null): bool
    {
        $today = ($reference ?? Carbon::today())->copy()->startOfDay();

        return $this->occurrenceIn($today->year)->isSameDay($today);
    }

    public function daysUntil(?Carbon $reference = null): int
    {
        $today = ($reference ?? Carbon::today())->copy()->startOfDay();

        return (int) $today->diffInDays($this->nextOccurrence($today), false);
    }

    /** Age reached on the next celebration, only when the birth year is known. */
    public function ageOnNextOccurrence(?Carbon $reference = null): ?int
    {
        if ($this->year === null) {
            return null;
        }

        return $this->nextOccurrence($reference)->year - $this->year;
    }

    public function currentAge(?Carbon $reference = null): ?int
    {
        $age = $this->ageOnNextOccurrence($reference);

        if ($age === null) {
            return null;
        }

        return $this->isToday($reference) ? $age : $age - 1;
    }

    public function label(): string
    {
        $months = [
            1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril', 5 => 'mayo', 6 => 'junio',
            7 => 'julio', 8 => 'agosto', 9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre',
        ];

        return $this->day.' de '.$months[$this->month].($this->year ? ' de '.$this->year : '');
    }
}
