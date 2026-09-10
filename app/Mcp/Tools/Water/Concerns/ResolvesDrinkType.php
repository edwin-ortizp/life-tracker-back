<?php

namespace App\Mcp\Tools\Water\Concerns;

use App\Models\DrinkType;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Response;

trait ResolvesDrinkType
{
    /**
     * Defaults to matching "agua" when neither id nor name is given, since most
     * hydration logs are plain water.
     *
     * @return DrinkType|Response Returns a Response::error(...) when the drink type
     *                            cannot be uniquely identified.
     */
    protected function resolveDrinkType(?string $drinkTypeId, ?string $name): DrinkType|Response
    {
        if ($drinkTypeId) {
            $type = Auth::user()->drinkTypes()->find($drinkTypeId);

            return $type ?? Response::error('No se encontró ese tipo de bebida en tu catálogo.');
        }

        $term = $name ?: 'agua';
        $matches = Auth::user()->drinkTypes()->where('name', 'like', "%{$term}%")->get();

        if ($matches->isEmpty()) {
            return Response::error("No encontré ningún tipo de bebida que coincida con \"{$term}\". Créalo desde la app o usa un nombre existente.");
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (DrinkType $type) => "{$type->name} (id: {$type->id})")->implode(', ');

            return Response::error("Hay varios tipos de bebida que coinciden con \"{$term}\": {$list}. Especifica el drink_type_id o un nombre más preciso.");
        }

        return $matches->first();
    }
}
