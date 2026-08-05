<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use InvalidArgumentException;

/**
 * A relationship event is stored as an orderable `starts_on`/`ends_on` window, but it is
 * always rendered with the precision the user actually provided, so the internal bounds
 * of a month or a year are never shown back as if they had been typed.
 */
final class EventDate
{
    public const DAY = 'day';

    public const MONTH = 'month';

    public const YEAR = 'year';

    public const RANGE = 'range';

    public const PRECISIONS = [
        self::DAY => 'Día exacto',
        self::MONTH => 'Mes y año',
        self::YEAR => 'Solo el año',
        self::RANGE => 'Intervalo',
    ];

    private const MONTH_NAMES = [
        1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril', 5 => 'mayo', 6 => 'junio',
        7 => 'julio', 8 => 'agosto', 9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre',
    ];

    private function __construct(
        public readonly string $precision,
        public readonly Carbon $startsOn,
        public readonly Carbon $endsOn,
    ) {
    }

    /**
     * Build a window from the fields the form exposes for the chosen precision.
     */
    public static function fromInput(
        string $precision,
        ?string $date = null,
        ?int $year = null,
        ?int $month = null,
        ?string $startsOn = null,
        ?string $endsOn = null,
    ): self {
        return match ($precision) {
            self::DAY => self::day(self::parse($date, 'Indica la fecha del acontecimiento.')),
            self::MONTH => self::month(
                self::requireInt($year, 'Indica el año del acontecimiento.'),
                self::requireInt($month, 'Indica el mes del acontecimiento.'),
            ),
            self::YEAR => self::year(self::requireInt($year, 'Indica el año del acontecimiento.')),
            self::RANGE => self::range(
                self::parse($startsOn, 'Indica la fecha inicial del intervalo.'),
                self::parse($endsOn, 'Indica la fecha final del intervalo.'),
            ),
            default => throw new InvalidArgumentException('La precisión de fecha no es válida.'),
        };
    }

    public static function fromWindow(string $precision, ?string $startsOn, ?string $endsOn): self
    {
        $start = self::parse($startsOn, 'El acontecimiento no tiene fecha inicial.');
        $end = $endsOn ? self::parse($endsOn, '') : $start;

        return new self(
            array_key_exists($precision, self::PRECISIONS) ? $precision : self::DAY,
            $start,
            $end,
        );
    }

    public static function day(Carbon $date): self
    {
        return new self(self::DAY, $date->copy()->startOfDay(), $date->copy()->startOfDay());
    }

    public static function month(int $year, int $month): self
    {
        if ($month < 1 || $month > 12) {
            throw new InvalidArgumentException('El mes indicado no existe.');
        }

        $start = Carbon::create($year, $month, 1)->startOfDay();

        return new self(self::MONTH, $start, $start->copy()->endOfMonth()->startOfDay());
    }

    public static function year(int $year): self
    {
        $start = Carbon::create($year, 1, 1)->startOfDay();

        return new self(self::YEAR, $start, $start->copy()->endOfYear()->startOfDay());
    }

    public static function range(Carbon $startsOn, Carbon $endsOn): self
    {
        if ($endsOn->lt($startsOn)) {
            throw new InvalidArgumentException('La fecha final no puede ser anterior a la inicial.');
        }

        return new self(self::RANGE, $startsOn->copy()->startOfDay(), $endsOn->copy()->startOfDay());
    }

    /** Attributes ready to persist on a relationship event. */
    public function toAttributes(): array
    {
        return [
            'date_precision' => $this->precision,
            'starts_on' => $this->startsOn->toDateString(),
            'ends_on' => $this->endsOn->toDateString(),
            'event_date' => $this->startsOn->toDateString(),
        ];
    }

    /** Human label that never exposes a precision the user did not provide. */
    public function label(): string
    {
        return match ($this->precision) {
            self::MONTH => self::MONTH_NAMES[$this->startsOn->month].' de '.$this->startsOn->year,
            self::YEAR => (string) $this->startsOn->year,
            self::RANGE => $this->rangeLabel(),
            default => self::dayLabel($this->startsOn),
        };
    }

    public function isUpcoming(?Carbon $reference = null): bool
    {
        return $this->endsOn->gte(($reference ?? Carbon::today())->copy()->startOfDay());
    }

    private function rangeLabel(): string
    {
        if ($this->startsOn->isSameMonth($this->endsOn, true)) {
            return $this->startsOn->day.' – '.$this->endsOn->day.' de '
                .self::MONTH_NAMES[$this->startsOn->month].' de '.$this->startsOn->year;
        }

        return self::dayLabel($this->startsOn).' – '.self::dayLabel($this->endsOn);
    }

    private static function dayLabel(Carbon $date): string
    {
        return $date->day.' de '.self::MONTH_NAMES[$date->month].' de '.$date->year;
    }

    private static function parse(?string $value, string $message): Carbon
    {
        if (! $value) {
            throw new InvalidArgumentException($message ?: 'La fecha indicada no es válida.');
        }

        return Carbon::parse($value);
    }

    private static function requireInt(?int $value, string $message): int
    {
        if ($value === null) {
            throw new InvalidArgumentException($message);
        }

        return $value;
    }
}
