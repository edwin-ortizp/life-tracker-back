<?php

namespace App\Mcp\Tools\Exercise;

use App\Mcp\Tools\Exercise\Concerns\ResolvesExerciseType;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra una sesión de ejercicio del usuario autenticado. Si no se indican calorías o pasos y hay duración, se calculan a partir del tipo de ejercicio.')]
class LogExerciseTool extends Tool
{
    use ResolvesExerciseType;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'exercise_type_id' => ['nullable', 'string'],
            'exercise_type_name' => ['nullable', 'string'],
            'date' => ['nullable', 'date'],
            'duration' => ['nullable', 'integer', 'min:0'],
            'sets' => ['nullable', 'integer', 'min:0'],
            'reps' => ['nullable', 'integer', 'min:0'],
            'distance' => ['nullable', 'numeric', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'calories' => ['nullable', 'integer', 'min:0'],
            'steps' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $type = $this->resolveExerciseType($data['exercise_type_id'] ?? null, $data['exercise_type_name'] ?? null);
        if ($type instanceof Response) {
            return $type;
        }

        $duration = $data['duration'] ?? null;
        $calories = $data['calories'] ?? null;
        $steps = $data['steps'] ?? null;

        // Mirrors App\Livewire\Exercise\ExerciseDaily::updatedDuration() — keep in sync.
        if ($duration !== null) {
            if ($calories === null && $type->calories_per_hour > 0) {
                $calories = (int) round(($duration / 60) * $type->calories_per_hour);
            }
            if ($steps === null && $type->steps_equivalent > 0) {
                $steps = (int) round(($duration / 60) * $type->steps_equivalent);
            }
        }

        $log = Auth::user()->exerciseLogs()->create([
            'date' => $data['date'] ?? today()->toDateString(),
            'exercise_type_id' => $type->id,
            'sets' => $data['sets'] ?? null,
            'reps' => $data['reps'] ?? null,
            'duration' => $duration,
            'distance' => $data['distance'] ?? null,
            'weight' => $data['weight'] ?? null,
            'calories' => $calories,
            'steps' => $steps,
            'notes' => $data['notes'] ?? null,
        ]);

        $message = "Ejercicio registrado: \"{$type->name}\" el {$log->date->toDateString()}.";
        if ($calories !== null) {
            $message .= " {$calories} kcal.";
        }
        if ($steps !== null) {
            $message .= " {$steps} pasos.";
        }

        return Response::text($message);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'exercise_type_id' => $schema->string()
                ->description('Identificador (UUID) del tipo de ejercicio en el catálogo del usuario. Alternativa a "exercise_type_name".'),
            'exercise_type_name' => $schema->string()
                ->description('Nombre del tipo de ejercicio (p. ej. "Correr"). Alternativa a "exercise_type_id".'),
            'date' => $schema->string()
                ->description('Fecha en formato YYYY-MM-DD. Por defecto hoy.'),
            'duration' => $schema->integer()
                ->description('Duración en minutos.'),
            'sets' => $schema->integer()
                ->description('Número de series.'),
            'reps' => $schema->integer()
                ->description('Número de repeticiones.'),
            'distance' => $schema->number()
                ->description('Distancia recorrida.'),
            'weight' => $schema->number()
                ->description('Peso usado.'),
            'calories' => $schema->integer()
                ->description('Calorías quemadas. Se calculan automáticamente a partir de la duración si se omite.'),
            'steps' => $schema->integer()
                ->description('Pasos equivalentes. Se calculan automáticamente a partir de la duración si se omite.'),
            'notes' => $schema->string()
                ->description('Notas adicionales.'),
        ];
    }
}
