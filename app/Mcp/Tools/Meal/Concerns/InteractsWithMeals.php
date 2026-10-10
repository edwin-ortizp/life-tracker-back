<?php

namespace App\Mcp\Tools\Meal\Concerns;

use App\Models\Recipe;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Response;

trait InteractsWithMeals
{
    /** Mismos tipos de comida que la pantalla semanal. */
    protected const MEAL_TYPES = [
        'desayuno' => 'Desayuno',
        'comida' => 'Onces (mañana)',
        'almuerzo' => 'Almuerzo',
        'merienda' => 'Merienda (tarde)',
        'cena' => 'Cena',
    ];

    protected const DIFFICULTIES = ['facil', 'medio', 'dificil'];

    protected function resolveRecipe(?string $recipeId, ?string $name): Recipe|Response
    {
        if ($recipeId) {
            return Auth::user()->recipes()->find($recipeId) ?? Response::error('No se encontró la receta o no te pertenece.');
        }

        if (blank($name)) {
            return Response::error('Debes indicar recipe_id o el nombre de la receta.');
        }

        $exact = Auth::user()->recipes()->whereRaw('lower(name) = ?', [mb_strtolower(trim($name))])->get();
        $matches = $exact->isNotEmpty()
            ? $exact
            : Auth::user()->recipes()->where('name', 'like', '%'.addcslashes(trim($name), '%_').'%')->get();

        if ($matches->isEmpty()) {
            return Response::error("No encontré ninguna receta que coincida con \"{$name}\". Usa list-recipes-tool, o regístrala como elemento libre con name.");
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (Recipe $recipe) => "{$recipe->name} (id: {$recipe->id})")->implode(', ');

            return Response::error("Hay varias recetas que coinciden con \"{$name}\": {$list}. Especifica el recipe_id.");
        }

        return $matches->first();
    }
}
