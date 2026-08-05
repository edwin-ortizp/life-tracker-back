<?php

namespace Database\Factories;

use App\Models\MoodState;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MoodState>
 */
class MoodStateFactory extends Factory
{
    protected $model = MoodState::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'emoji' => '🙂',
            'text' => $this->faker->unique()->word(),
            'value' => 5,
            'category' => 'Emocional',
            'default_key' => null,
            'is_active' => true,
            'is_pinned' => false,
            'sort_order' => 0,
        ];
    }
}
