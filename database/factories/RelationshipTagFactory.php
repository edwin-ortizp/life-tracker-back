<?php

namespace Database\Factories;

use App\Models\RelationshipTag;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RelationshipTag>
 */
class RelationshipTagFactory extends Factory
{
    protected $model = RelationshipTag::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->unique()->word(),
            'sort_order' => 0,
        ];
    }
}
