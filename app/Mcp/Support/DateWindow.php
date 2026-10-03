<?php

namespace App\Mcp\Support;

use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Ventana de fechas común a las herramientas de lectura: since/until explícitos
 * o, si faltan, los últimos N días hasta hoy.
 */
final class DateWindow
{
    private function __construct(public readonly Carbon $from, public readonly Carbon $to) {}

    /** Reglas de validación para mezclar en $request->validate(). */
    public static function rules(): array
    {
        return [
            'since' => ['nullable', 'date'],
            'until' => ['nullable', 'date'],
        ];
    }

    /** @param  array<string, mixed>  $data */
    public static function fromInput(array $data, int $defaultDays): self
    {
        $timezone = config('app.timezone');
        $to = filled($data['until'] ?? null)
            ? Carbon::parse($data['until'], $timezone)->startOfDay()
            : Carbon::today($timezone);
        $from = filled($data['since'] ?? null)
            ? Carbon::parse($data['since'], $timezone)->startOfDay()
            : $to->copy()->subDays(max($defaultDays, 1) - 1);

        if ($from->gt($to)) {
            throw ValidationException::withMessages(['since' => '"since" no puede ser posterior a "until".']);
        }

        return new self($from, $to);
    }

    public function fromDate(): string
    {
        return $this->from->toDateString();
    }

    public function toDate(): string
    {
        return $this->to->toDateString();
    }

    /** @return array{from: string, to: string} */
    public function toArray(): array
    {
        return ['from' => $this->fromDate(), 'to' => $this->toDate()];
    }
}
