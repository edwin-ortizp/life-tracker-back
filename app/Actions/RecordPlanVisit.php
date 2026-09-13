<?php

namespace App\Actions;

use App\Models\Plan;
use App\Models\PlanVisit;
use App\Models\Relationship;
use Illuminate\Support\Facades\DB;

/** Records that a plan was done with some people. Shared by the Planes screens and the MCP tools. */
class RecordPlanVisit
{
    /** @param  iterable<string>  $relationshipIds */
    public static function handle(Plan $plan, string $visitedOn, iterable $relationshipIds, ?string $comment = null): PlanVisit
    {
        return DB::transaction(function () use ($plan, $visitedOn, $relationshipIds, $comment): PlanVisit {
            // Global scopes keep only the people of the signed-in user.
            $people = Relationship::query()->whereKey(collect($relationshipIds)->all())->pluck('id');

            $visit = new PlanVisit([
                'plan_id' => $plan->id,
                'visited_on' => $visitedOn,
                'comment' => trim((string) $comment) ?: null,
            ]);
            $visit->user_id = $plan->user_id;
            $visit->save();

            $visit->relationships()->sync($people);
            $plan->relationships()->syncWithoutDetaching($people);

            // A dated plan is fulfilled by doing it; open-ended plans stay available to repeat.
            if ($plan->status === 'scheduled') {
                $plan->update(['status' => 'done']);
            }

            return $visit;
        });
    }
}
