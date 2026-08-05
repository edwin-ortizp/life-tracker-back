<?php

namespace Database\Factories;

use App\Models\Relationship;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Relationship>
 */
class RelationshipFactory extends Factory
{
    protected $model = Relationship::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'full_name' => $this->faker->name(),
            'category' => 'amistad',
            'is_archived' => false,
        ];
    }

    public function withBirthday(int $month, int $day, ?int $year = null): static
    {
        return $this->state(fn () => [
            'birthday_month' => $month,
            'birthday_day' => $day,
            'birthday_year' => $year,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['is_archived' => true, 'archived_at' => now()]);
    }
}
