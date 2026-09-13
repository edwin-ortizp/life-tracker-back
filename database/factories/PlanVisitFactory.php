<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\PlanVisit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlanVisit>
 */
class PlanVisitFactory extends Factory
{
    protected $model = PlanVisit::class;

    public function definition(): array
    {
        return [
            'plan_id' => Plan::factory(),
            'user_id' => fn (array $attributes) => Plan::withoutGlobalScopes()->find($attributes['plan_id'])->user_id,
            'visited_on' => today()->subMonth()->toDateString(),
        ];
    }
}
