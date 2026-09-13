<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => $this->faker->unique()->words(3, true),
            'type' => 'restaurant',
            'city' => 'Popayán',
            'status' => 'pending',
        ];
    }

    public function scheduled(string $date): static
    {
        return $this->state(fn () => ['status' => 'scheduled', 'scheduled_on' => $date]);
    }
}
