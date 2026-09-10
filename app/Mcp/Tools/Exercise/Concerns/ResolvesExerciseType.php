<?php

namespace App\Mcp\Tools\Exercise\Concerns;

use App\Models\ExerciseType;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Response;

trait ResolvesExerciseType
{
    /**
     * @return ExerciseType|Response Returns a Response::error(...) when the exercise
     *                               type cannot be uniquely identified.
     */
    protected function resolveExerciseType(?string $exerciseTypeId, ?string $name): ExerciseType|Response
    {
        if ($exerciseTypeId) {
            $type = Auth::user()->exerciseTypes()->find($exerciseTypeId);

            return $type ?? Response::error('No se encontró ese tipo de ejercicio en tu catálogo.');
        }

        if (! $name) {
            return Response::error('Debes indicar exercise_type_id o exercise_type_name para identificar el ejercicio.');
        }

        $matches = Auth::user()->exerciseTypes()->where('name', 'like', "%{$name}%")->get();

        if ($matches->isEmpty()) {
            return Response::error("No encontré ningún tipo de ejercicio que coincida con \"{$name}\" en tu catálogo. Créalo desde la app o usa un nombre existente.");
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (ExerciseType $type) => "{$type->name} (id: {$type->id})")->implode(', ');

            return Response::error("Hay varios tipos de ejercicio que coinciden con \"{$name}\": {$list}. Especifica el exercise_type_id o un nombre más preciso.");
        }

        return $matches->first();
    }
}
