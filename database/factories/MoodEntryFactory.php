<?php

namespace Database\Factories;

use App\Models\MoodEntry;
use App\Models\MoodState;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MoodEntry>
 */
class MoodEntryFactory extends Factory
{
    protected $model = MoodEntry::class;

    public function definition(): array
    {
        $now = now();

        return [
            'user_id' => User::factory(),
            // The composite foreign key requires the state to share the entry's owner.
            'mood_state_id' => fn (array $attributes) => MoodState::factory()
                ->create(['user_id' => $attributes['user_id']])->id,
            'date' => $now->toDateString(),
            'emoji' => fn (array $attributes) => MoodState::withoutGlobalScopes()
                ->findOrFail($attributes['mood_state_id'])->emoji,
            'text' => fn (array $attributes) => MoodState::withoutGlobalScopes()
                ->findOrFail($attributes['mood_state_id'])->text,
            'value' => fn (array $attributes) => MoodState::withoutGlobalScopes()
                ->findOrFail($attributes['mood_state_id'])->value,
            'time' => $now->format('H:i'),
            'timestamp' => $now->timestamp,
            'source' => 'manual',
        ];
    }

    public function forState(MoodState $state): static
    {
        return $this->state(fn () => [
            'mood_state_id' => $state->id,
            'user_id' => $state->user_id,
            'emoji' => $state->emoji,
            'text' => $state->text,
            'value' => $state->value,
        ]);
    }

    public function on(string $date): static
    {
        return $this->state(fn () => [
            'date' => $date,
            'timestamp' => \Illuminate\Support\Carbon::parse($date)->timestamp,
        ]);
    }

    public function withIntensity(int $intensity): static
    {
        return $this->state(fn () => ['intensity' => $intensity]);
    }
}
