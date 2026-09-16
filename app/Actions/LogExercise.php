<?php

namespace App\Actions;

use App\Models\ExerciseLog;
use App\Models\ExerciseType;

/**
 * Registra una sesión de ejercicio. Compartida por las pantallas de Ejercicio,
 * las herramientas MCP y las acciones de hábitos.
 *
 * El dueño del registro lo asigna el trait BelongsToUser a partir del usuario autenticado.
 */
class LogExercise
{
    /**
     * Calorías y pasos que implica una duración según el tipo de ejercicio.
     * Cada valor es null cuando no hay duración o el tipo no define esa tasa.
     *
     * @return array{calories: ?int, steps: ?int}
     */
    public static function estimate(ExerciseType $type, ?int $duration): array
    {
        if (! $duration) {
            return ['calories' => null, 'steps' => null];
        }

        return [
            'calories' => $type->calories_per_hour > 0
                ? (int) round(($duration / 60) * $type->calories_per_hour)
                : null,
            'steps' => $type->steps_equivalent > 0
                ? (int) round(($duration / 60) * $type->steps_equivalent)
                : null,
        ];
    }

    /**
     * Crea el registro completando calorías y pasos a partir de la duración
     * cuando no se indicaron explícitamente.
     *
     * @param  array{sets?: ?int, reps?: ?int, duration?: ?int, distance?: ?float, weight?: ?float, calories?: ?int, steps?: ?int, notes?: ?string}  $data
     */
    public static function handle(ExerciseType $type, string $date, array $data): ExerciseLog
    {
        $duration = $data['duration'] ?? null;
        $estimate = self::estimate($type, $duration);

        return ExerciseLog::create([
            'date' => $date,
            'exercise_type_id' => $type->id,
            'sets' => $data['sets'] ?? null,
            'reps' => $data['reps'] ?? null,
            'duration' => $duration,
            'distance' => $data['distance'] ?? null,
            'weight' => $data['weight'] ?? null,
            'calories' => $data['calories'] ?? $estimate['calories'],
            'steps' => $data['steps'] ?? $estimate['steps'],
            'notes' => $data['notes'] ?? null,
        ]);
    }
}
