<?php

namespace Database\Factories;

use App\Models\Circle;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Circle>
 */
class CircleFactory extends Factory
{
    protected $model = Circle::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->unique()->word(),
            'sort_order' => 0,
        ];
    }
}
