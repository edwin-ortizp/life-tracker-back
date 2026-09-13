<?php

namespace App\Mcp\Tools\Plan\Concerns;

use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use App\Models\Plan;
use App\Models\Relationship;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Response;

trait ResolvesPlanTargets
{
    use ResolvesContact;

    /** @return Collection<int, string>|Response Circle ids, or the error of the first name that cannot be resolved. */
    protected function resolveCircleIds(array $names): Collection|Response
    {
        $ids = collect();

        foreach ($names as $name) {
            $id = $this->resolveCircleId($name);
            if ($id instanceof Response) {
                return Response::error($id->content()->__toString().' Usa list-circles-tool para ver tus círculos.');
            }
            $ids->push($id);
        }

        return $ids->unique()->values();
    }

    /** @return Collection<int, string>|Response Contact ids, or the error of the first name that cannot be resolved. */
    protected function resolveContactIds(array $names): Collection|Response
    {
        $ids = collect();

        foreach ($names as $name) {
            $contact = $this->resolveContact(null, $name);
            if ($contact instanceof Response) {
                return $contact;
            }
            $ids->push($contact->id);
        }

        return $ids->unique()->values();
    }

    protected function resolvePlan(?string $planId, ?string $title): Plan|Response
    {
        if ($planId) {
            return Auth::user()->plans()->find($planId) ?? Response::error('No se encontró el plan o no te pertenece.');
        }

        if (! $title) {
            return Response::error('Debes indicar plan_id o title para identificar el plan.');
        }

        $exact = Auth::user()->plans()->whereRaw('lower(title) = ?', [mb_strtolower(trim($title))])->get();
        $matches = $exact->isNotEmpty() ? $exact : Auth::user()->plans()->where('title', 'like', "%{$title}%")->get();

        if ($matches->isEmpty()) {
            return Response::error("No encontré ningún plan que coincida con \"{$title}\". Usa list-plans-tool para revisar tus planes.");
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (Plan $plan) => "{$plan->title}".($plan->city ? " ({$plan->city})" : '')." (id: {$plan->id})")->implode(', ');

            return Response::error("Hay varios planes que coinciden con \"{$title}\": {$list}. Especifica el plan_id.");
        }

        return $matches->first();
    }

    protected function describePlan(Plan $plan): string
    {
        $plan->load(['circles', 'relationships']);

        $parts = [$plan->typeLabel().($plan->city ? ", {$plan->city}" : ''), $plan->statusLabel()];
        if ($plan->scheduled_on) {
            $parts[] = 'fecha: '.$plan->scheduled_on->toDateString();
        }
        $parts[] = 'círculos: '.($plan->circles->pluck('name')->implode(', ') ?: 'ninguno');
        if ($plan->relationships->isNotEmpty()) {
            $parts[] = 'personas: '.$plan->relationships->map(fn (Relationship $person) => $person->displayName())->implode(', ');
        }

        return "\"{$plan->title}\" (".implode(' · ', $parts).") (id: {$plan->id})";
    }
}
