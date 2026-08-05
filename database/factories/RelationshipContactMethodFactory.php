<?php

namespace Database\Factories;

use App\Models\Relationship;
use App\Models\RelationshipContactMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RelationshipContactMethod>
 */
class RelationshipContactMethodFactory extends Factory
{
    protected $model = RelationshipContactMethod::class;

    public function definition(): array
    {
        return [
            'relationship_id' => Relationship::factory(),
            'user_id' => fn (array $attributes) => Relationship::withoutGlobalScopes()
                ->findOrFail($attributes['relationship_id'])->user_id,
            'type' => 'phone',
            'label' => 'Personal',
            'value' => $this->faker->numerify('300#######'),
            'is_primary' => false,
            'sort_order' => 0,
        ];
    }

    public function forRelationship(Relationship $relationship): static
    {
        return $this->state(fn () => [
            'relationship_id' => $relationship->id,
            'user_id' => $relationship->user_id,
        ]);
    }

    public function primary(): static
    {
        return $this->state(fn () => ['is_primary' => true]);
    }
}
