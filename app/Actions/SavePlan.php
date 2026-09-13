<?php

namespace App\Actions;

use App\Models\Circle;
use App\Models\Plan;
use App\Models\Relationship;
use Illuminate\Support\Facades\DB;

/**
 * Persists a plan with its circles, people and links. Shared by the Planes
 * screens and the MCP tools so both follow the same status rules.
 */
class SavePlan
{
    /**
     * @param  iterable<string>|null  $circleIds  Replaces the circles; null leaves them unchanged.
     * @param  iterable<string>|null  $relationshipIds  Replaces the people; null leaves them unchanged.
     * @param  array<int, array{url: string, label?: ?string}>|null  $links  Replaces the links; null leaves them unchanged.
     * @param  array<int, string>|null  $images  Image URLs in display order, main first; null leaves them unchanged.
     */
    public static function handle(Plan $plan, array $attributes, ?iterable $circleIds = null, ?iterable $relationshipIds = null, ?array $links = null, ?array $images = null): Plan
    {
        return DB::transaction(function () use ($plan, $attributes, $circleIds, $relationshipIds, $links, $images): Plan {
            $plan->fill($attributes);

            // A date turns an open plan into a scheduled one, and removing it undoes that.
            $status = $plan->status ?? 'pending';
            if ($plan->scheduled_on && $status === 'pending') {
                $status = 'scheduled';
            } elseif (! $plan->scheduled_on && $status === 'scheduled') {
                $status = 'pending';
            }
            $plan->status = $status;
            $plan->save();

            // Global scopes keep only the circles and people of the signed-in user.
            if ($circleIds !== null) {
                $plan->circles()->sync(Circle::query()->whereKey(collect($circleIds)->all())->pluck('id'));
            }

            if ($relationshipIds !== null) {
                $plan->relationships()->sync(Relationship::query()->whereKey(collect($relationshipIds)->all())->pluck('id'));
            }

            if ($links !== null) {
                $plan->links()->delete();
                foreach ($links as $link) {
                    $plan->links()->create([
                        'url' => trim($link['url']),
                        'label' => trim($link['label'] ?? '') ?: null,
                    ]);
                }
            }

            if ($images !== null) {
                $plan->images()->delete();
                foreach (array_values(array_unique(array_map('trim', $images))) as $position => $url) {
                    $plan->images()->create(['url' => $url, 'position' => $position]);
                }
            }

            return $plan;
        });
    }
}
