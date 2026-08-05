<?php

namespace Database\Factories;

use App\Models\Relationship;
use App\Models\RelationshipEvent;
use App\Support\EventDate;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<RelationshipEvent>
 */
class RelationshipEventFactory extends Factory
{
    protected $model = RelationshipEvent::class;

    public function definition(): array
    {
        $relationship = Relationship::factory();

        return [
            'relationship_id' => $relationship,
            'user_id' => fn (array $attributes) => Relationship::withoutGlobalScopes()
                ->findOrFail($attributes['relationship_id'])->user_id,
            'title' => $this->faker->sentence(3),
            'category' => 'milestone',
            'is_sensitive' => false,
            'is_archived' => false,
            ...EventDate::day(Carbon::today())->toAttributes(),
        ];
    }

    public function on(EventDate $date): static
    {
        return $this->state(fn () => $date->toAttributes());
    }

    public function forRelationship(Relationship $relationship): static
    {
        return $this->state(fn () => [
            'relationship_id' => $relationship->id,
            'user_id' => $relationship->user_id,
        ]);
    }

    public function sensitive(): static
    {
        return $this->state(fn () => ['is_sensitive' => true]);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['is_archived' => true, 'archived_at' => now()]);
    }
}
