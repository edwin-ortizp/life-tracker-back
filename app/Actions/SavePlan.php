<?php

namespace App\Actions;

use App\Models\Circle;
use App\Models\Plan;
use App\Models\PlanCategory;
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
     * @param  array<int, string>|null  $tagIds  Replaces the plan tags; null leaves them unchanged.
     */
    public static function handle(Plan $plan, array $attributes, ?iterable $circleIds = null, ?iterable $relationshipIds = null, ?array $links = null, ?array $images = null, ?array $tagIds = null): Plan
    {
        return DB::transaction(function () use ($plan, $attributes, $circleIds, $relationshipIds, $links, $images, $tagIds): Plan {
            $owner = $plan->user_id ?: auth()->id();
            abort_unless($owner, 403);
            if (array_key_exists('plan_category_id', $attributes)) {
                $category = filled($attributes['plan_category_id'])
                    ? PlanCategory::withoutGlobalScopes()->where('user_id', $owner)->findOrFail($attributes['plan_category_id']) : null;
                $attributes['category'] = $category?->name;
            } elseif (array_key_exists('category', $attributes)) {
                $name = preg_replace('/\s+/u', ' ', trim($attributes['category'] ?? ''));
                $category = $name === '' ? null : PlanCategory::withoutGlobalScopes()->firstOrCreate(
                    ['user_id' => $owner, 'normalized_name' => PlanCategory::normalized($name)],
                    ['name' => $name, 'icon' => 'bi-grid'],
                );
                $attributes['plan_category_id'] = $category?->id;
                $attributes['category'] = $category?->name;
            }
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

            if ($tagIds !== null) {
                $plan->syncTags($tagIds);
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
