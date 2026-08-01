<?php

namespace App\Services\CalDav;

use Carbon\Carbon;
use InvalidArgumentException;
use Sabre\VObject\Recur\RRuleIterator;

class RecurrenceRule
{
    private const ALLOWED = ['FREQ', 'INTERVAL', 'BYDAY', 'BYMONTHDAY', 'BYMONTH', 'COUNT', 'UNTIL', 'WKST', 'BYSETPOS'];

    public function normalize(string $rule): string
    {
        $parts = [];
        foreach (explode(';', strtoupper(trim($rule))) as $part) {
            if (! str_contains($part, '=')) {
                throw new InvalidArgumentException('RRULE no válida.');
            }
            [$key, $value] = explode('=', $part, 2);
            if (! in_array($key, self::ALLOWED, true) || $value === '') {
                throw new InvalidArgumentException("La propiedad RRULE {$key} no está soportada.");
            }
            $parts[$key] = $value;
        }

        if (! in_array($parts['FREQ'] ?? null, ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], true)) {
            throw new InvalidArgumentException('RRULE debe usar frecuencia diaria, semanal, mensual o anual.');
        }
        if (isset($parts['COUNT'], $parts['UNTIL'])) {
            throw new InvalidArgumentException('RRULE no puede contener COUNT y UNTIL simultáneamente.');
        }
        foreach (['INTERVAL', 'COUNT'] as $integerPart) {
            if (isset($parts[$integerPart]) && (! ctype_digit($parts[$integerPart]) || (int) $parts[$integerPart] < 1)) {
                throw new InvalidArgumentException("{$integerPart} debe ser un entero positivo.");
            }
        }
        if (isset($parts['UNTIL']) && ! preg_match('/^\d{8}(T\d{6}Z?)?$/', $parts['UNTIL'])) {
            throw new InvalidArgumentException('UNTIL no tiene un formato iCalendar válido.');
        }
        if (isset($parts['BYDAY']) && ! preg_match('/^-?\d*(MO|TU|WE|TH|FR|SA|SU)(,-?\d*(MO|TU|WE|TH|FR|SA|SU))*$/', $parts['BYDAY'])) {
            throw new InvalidArgumentException('BYDAY no contiene días válidos.');
        }

        return collect($parts)->map(fn (string $value, string $key) => $key.'='.$value)->implode(';');
    }

    public function fromTaskRecurrence(?array $recurrence): ?string
    {
        if (! $recurrence) {
            return null;
        }
        if (filled($recurrence['rrule'] ?? null)) {
            return $this->normalize($recurrence['rrule']);
        }

        $frequency = max(1, (int) ($recurrence['frequency'] ?? 1));

        return match ($recurrence['pattern'] ?? 'custom') {
            'daily' => 'FREQ=DAILY;INTERVAL='.$frequency,
            'weekly' => 'FREQ=WEEKLY;INTERVAL='.$frequency,
            'monthly' => 'FREQ=MONTHLY;INTERVAL='.$frequency,
            default => 'FREQ=DAILY;INTERVAL='.max(1, (int) ($recurrence['customDays'] ?? $frequency)),
        };
    }

    public function next(string $rule, Carbon $anchor, int $completed): ?Carbon
    {
        $iterator = new RRuleIterator($this->normalize($rule), $anchor->toDateTimeImmutable());
        $iterator->rewind();
        $date = null;

        for ($index = 0; $index <= $completed; $index++) {
            if (! $iterator->valid()) {
                return null;
            }
            $date = Carbon::instance($iterator->current());
            $iterator->next();
        }

        return $date;
    }
}
