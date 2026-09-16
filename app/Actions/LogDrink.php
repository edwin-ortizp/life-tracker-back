<?php

namespace App\Actions;

use App\Models\DrinkLog;
use App\Models\DrinkType;
use Carbon\Carbon;

/**
 * Registra una toma de líquido. Compartida por las pantallas de Hidratación,
 * las herramientas MCP y las acciones de hábitos.
 *
 * El dueño del registro lo asigna el trait BelongsToUser a partir del usuario autenticado.
 */
class LogDrink
{
    /** Hidratación efectiva de una cantidad según el factor del tipo de bebida. */
    public static function hydrationValue(DrinkType $type, int $amount): int
    {
        return (int) round($amount * $type->hydration_factor);
    }

    /** @param  string|null  $time  Hora HH:MM; por defecto la hora actual. */
    public static function handle(DrinkType $type, string $date, int $amount, ?string $time = null): DrinkLog
    {
        $time ??= now()->format('H:i');

        return DrinkLog::create([
            'date' => $date,
            ...self::attributes($type, $amount, $date, $time),
        ]);
    }

    /** Actualiza un registro existente sin moverlo de día. */
    public static function update(DrinkLog $log, DrinkType $type, int $amount, string $time): DrinkLog
    {
        $log->update(self::attributes($type, $amount, $log->date->toDateString(), $time));

        return $log;
    }

    /** @return array<string, mixed> */
    private static function attributes(DrinkType $type, int $amount, string $date, string $time): array
    {
        return [
            'drink_type' => $type->name,
            'drink_type_id' => $type->id,
            'amount' => $amount,
            'hydration_value' => self::hydrationValue($type, $amount),
            'time' => $time,
            'timestamp' => Carbon::createFromFormat('Y-m-d H:i', "{$date} {$time}")->timestamp,
        ];
    }
}
