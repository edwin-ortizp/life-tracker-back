<?php

namespace App\Mcp\Tools\Relationship\Concerns;

use App\Models\Circle;
use App\Models\Relationship;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Response;

trait ResolvesContact
{
    /**
     * @return string|Response|null A circle id, null when no name was given, or a
     *                              Response::error(...) when the circle cannot be
     *                              uniquely identified.
     */
    protected function resolveCircleId(?string $circleName): string|Response|null
    {
        if (! $circleName) {
            return null;
        }

        $matches = Auth::user()->circles()->where('name', 'like', "%{$circleName}%")->get();

        if ($matches->isEmpty()) {
            return Response::error("No encontré ningún círculo que coincida con \"{$circleName}\".");
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (Circle $circle) => "{$circle->name} (id: {$circle->id})")->implode(', ');

            return Response::error("Hay varios círculos que coinciden con \"{$circleName}\": {$list}. Especifica un nombre más preciso.");
        }

        return $matches->first()->id;
    }

    /**
     * @return Relationship|Response Returns a Response::error(...) when the contact
     *                               cannot be uniquely identified.
     */
    protected function resolveContact(?string $contactId, ?string $name): Relationship|Response
    {
        if ($contactId) {
            $relationship = Auth::user()->relationships()->find($contactId);

            return $relationship ?? Response::error('No se encontró el contacto o no te pertenece.');
        }

        if (! $name) {
            return Response::error('Debes indicar contact_id o name para identificar al contacto.');
        }

        $matches = Auth::user()->relationships()
            ->where(fn ($query) => $query->where('full_name', 'like', "%{$name}%")->orWhere('nickname', 'like', "%{$name}%"))
            ->get();

        if ($matches->isEmpty()) {
            return Response::error("No encontré ningún contacto que coincida con \"{$name}\". Usa list_contacts para revisar tus contactos.");
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (Relationship $relationship) => "{$relationship->displayName()} (id: {$relationship->id})")->implode(', ');

            return Response::error("Hay varios contactos que coinciden con \"{$name}\": {$list}. Especifica el contact_id o un nombre más preciso.");
        }

        return $matches->first();
    }
}
