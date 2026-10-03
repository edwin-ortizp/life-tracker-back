<?php

namespace App\Mcp\Tools\Relationship\Concerns;

use App\Models\Circle;
use App\Models\Relationship;
use Illuminate\Database\Eloquent\Collection;
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

        // An exact name wins, so "Familia" is not confused with "Familia muy cercana".
        $exact = Auth::user()->circles()->whereRaw('lower(name) = ?', [mb_strtolower(trim($circleName))])->get();
        $matches = $exact->count() === 1
            ? $exact
            : Auth::user()->circles()->where('name', 'like', "%{$circleName}%")->get();

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

        $matches = $this->matchContacts($name);

        if ($matches->isEmpty()) {
            return Response::error("No encontré ningún contacto que coincida con \"{$name}\". Usa list_contacts para revisar tus contactos.");
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (Relationship $relationship) => "{$relationship->displayName()} (id: {$relationship->id})")->implode(', ');

            return Response::error("Hay varios contactos que coinciden con \"{$name}\": {$list}. Especifica el contact_id o un nombre más preciso.");
        }

        return $matches->first();
    }

    /**
     * Busca contactos por nombre, apodo o alias en tres niveles y devuelve solo
     * el primero que tenga resultados:
     *  1. coincidencia exacta (sin distinguir mayúsculas) de alias, apodo o nombre;
     *  2. alguna palabra del nombre, apodo o alias empieza por el texto;
     *  3. el texto aparece en cualquier parte.
     * Así "Ali" encuentra a quien tiene el alias "ali" y no a "Aliria" o "Natalia".
     *
     * @return Collection<int, Relationship>
     */
    protected function matchContacts(string $name, bool $activeOnly = false): Collection
    {
        $term = mb_strtolower(trim($name));

        if ($term === '') {
            return new Collection;
        }

        $base = fn () => Auth::user()->relationships()
            ->when($activeOnly, fn ($query) => $query->active());

        $exact = $base()
            ->where(fn ($query) => $query
                ->whereRaw('lower(full_name) = ?', [$term])
                ->orWhereRaw('lower(nickname) = ?', [$term])
                ->orWhereHas('aliases', fn ($aliases) => $aliases->whereRaw('lower(alias) = ?', [$term])))
            ->get();

        if ($exact->isNotEmpty()) {
            return $exact;
        }

        $like = addcslashes($term, '%_');

        $wordStart = $base()
            ->where(fn ($query) => $query
                ->where('full_name', 'like', "{$like}%")
                ->orWhere('full_name', 'like', "% {$like}%")
                ->orWhere('nickname', 'like', "{$like}%")
                ->orWhereHas('aliases', fn ($aliases) => $aliases->where('alias', 'like', "{$like}%")))
            ->get();

        if ($wordStart->isNotEmpty()) {
            return $wordStart;
        }

        return $base()
            ->where(fn ($query) => $query
                ->where('full_name', 'like', "%{$like}%")
                ->orWhere('nickname', 'like', "%{$like}%")
                ->orWhereHas('aliases', fn ($aliases) => $aliases->where('alias', 'like', "%{$like}%")))
            ->get();
    }
}
