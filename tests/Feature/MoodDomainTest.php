<?php

namespace Tests\Feature;

use App\Models\MoodEntry;
use App\Models\MoodReflection;
use App\Models\MoodState;
use App\Models\Relationship;
use App\Models\User;
use App\Support\DefaultMoodStates;
use App\Support\ReflectionSteps;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use InvalidArgumentException;
use Tests\TestCase;

class MoodDomainTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-08-04 09:00:00');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_an_entry_is_valid_without_any_context(): void
    {
        $entry = MoodEntry::factory()->create(['user_id' => $this->user->id]);

        $this->assertNull($entry->intensity);
        $this->assertNull($entry->situation);
        $this->assertNull($entry->reflection);
        $this->assertCount(0, $entry->relationships);
    }

    public function test_intensity_and_situation_are_stored_when_provided(): void
    {
        $entry = MoodEntry::factory()->create(['user_id' => $this->user->id]);

        $entry->update(['intensity' => 4, 'situation' => 'Discutí con Alison']);

        $this->assertSame(4, $entry->fresh()->intensity);
        $this->assertSame('Discutí con Alison', $entry->fresh()->situation);
    }

    public function test_changing_the_emotion_keeps_a_single_primary_emotion_and_its_context(): void
    {
        $sad = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Triste', 'emoji' => '😢', 'value' => 1]);
        $worried = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Preocupación', 'emoji' => '😟', 'value' => 3]);

        $entry = MoodEntry::factory()->forState($sad)->create([
            'intensity' => 3,
            'situation' => 'Discutí con Alison',
        ]);

        $entry->applyMoodState($worried);
        $entry->refresh();

        $this->assertSame($worried->id, $entry->mood_state_id);
        $this->assertSame('Preocupación', $entry->text);
        $this->assertSame('😟', $entry->emoji);
        $this->assertSame(3, $entry->value);
        $this->assertSame(3, $entry->intensity, 'The existing context survives the correction.');
        $this->assertSame('Discutí con Alison', $entry->situation);
    }

    public function test_an_entry_has_at_most_one_reflection(): void
    {
        $entry = MoodEntry::factory()->create(['user_id' => $this->user->id]);
        MoodReflection::create(['user_id' => $this->user->id, 'mood_entry_id' => $entry->id]);

        $this->expectException(QueryException::class);
        MoodReflection::create(['user_id' => $this->user->id, 'mood_entry_id' => $entry->id]);
    }

    public function test_deleting_an_entry_removes_its_reflection_but_not_the_other_way_round(): void
    {
        $entry = MoodEntry::factory()->create(['user_id' => $this->user->id]);
        $reflection = MoodReflection::create([
            'user_id' => $this->user->id,
            'mood_entry_id' => $entry->id,
            'automatic_thought' => 'Siempre discutimos',
        ]);

        $reflection->delete();

        $this->assertDatabaseHas('mood_entries', ['id' => $entry->id]);
        $this->assertNull($entry->fresh()->reflection);

        $entry->delete();
        $this->assertDatabaseMissing('mood_entries', ['id' => $entry->id]);
        $this->assertDatabaseCount('mood_reflections', 0);
    }

    public function test_a_reflection_summary_only_lists_the_answers_that_exist(): void
    {
        $entry = MoodEntry::factory()->create(['user_id' => $this->user->id, 'situation' => 'Discutí con Alison']);
        $reflection = MoodReflection::create([
            'user_id' => $this->user->id,
            'mood_entry_id' => $entry->id,
            'automatic_thought' => 'No me escucha',
            'intensity_after' => 3,
        ]);

        $answered = $reflection->fresh()->answeredSteps();

        $this->assertSame(
            [ReflectionSteps::SITUATION, ReflectionSteps::AUTOMATIC_THOUGHT, ReflectionSteps::INTENSITY_AFTER],
            array_column($answered, 'step')
        );
        $this->assertSame('3 de 5', $answered[2]['answer']);
    }

    public function test_the_step_sequence_is_deterministic_and_finite(): void
    {
        $this->assertSame([
            'situation', 'automatic_thought', 'evidence_for', 'evidence_against',
            'balanced_perspective', 'intensity_after', 'next_step',
        ], ReflectionSteps::order());

        $this->assertSame('automatic_thought', ReflectionSteps::next('situation'));
        $this->assertNull(ReflectionSteps::next('next_step'));
        $this->assertTrue(ReflectionSteps::isLast('next_step'));
        $this->assertSame(7, ReflectionSteps::total());
    }

    public function test_linking_a_relationship_from_another_user_is_rejected(): void
    {
        $other = User::factory()->create();
        $foreign = Relationship::factory()->create(['user_id' => $other->id]);
        $entry = MoodEntry::factory()->create(['user_id' => $this->user->id]);

        $this->expectException(InvalidArgumentException::class);
        $entry->linkRelationship($foreign);
    }

    public function test_an_entry_can_link_zero_or_several_relationships(): void
    {
        $entry = MoodEntry::factory()->create(['user_id' => $this->user->id]);
        $alison = Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Alison']);
        $dad = Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Papá']);

        $this->assertCount(0, $entry->relationships);

        $entry->linkRelationship($alison);
        $entry->linkRelationship($dad);
        $entry->linkRelationship($alison);

        $this->assertCount(2, $entry->fresh()->relationships, 'Linking twice must not duplicate.');
        $this->assertDatabaseCount('mood_entry_relationship', 2);

        $entry->unlinkRelationship($dad);
        $this->assertSame(['Alison'], $entry->fresh()->relationships->pluck('full_name')->all());
    }

    public function test_deleting_a_relationship_keeps_the_entry_and_its_reflection(): void
    {
        $entry = MoodEntry::factory()->create(['user_id' => $this->user->id]);
        $alison = Relationship::factory()->create(['user_id' => $this->user->id]);
        $entry->linkRelationship($alison);
        MoodReflection::create([
            'user_id' => $this->user->id,
            'mood_entry_id' => $entry->id,
            'automatic_thought' => 'No me escucha',
        ]);

        $alison->delete();

        $this->assertDatabaseHas('mood_entries', ['id' => $entry->id]);
        $this->assertDatabaseCount('mood_reflections', 1);
        $this->assertDatabaseCount('mood_entry_relationship', 0);
    }

    public function test_the_catalog_seeds_idempotently_and_preserves_custom_states(): void
    {
        MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Feliz', 'emoji' => '🥳', 'value' => 8]);

        DefaultMoodStates::createFor($this->user);
        DefaultMoodStates::createFor($this->user);

        $this->assertSame(count(DefaultMoodStates::all()), MoodState::count());

        $custom = MoodState::firstWhere('text', 'Feliz');
        $this->assertSame('🥳', $custom->emoji, 'A customized state is never overwritten.');
        $this->assertSame(8, $custom->value);

        foreach (['Preocupación', 'Gratitud', 'Alivio'] as $text) {
            $this->assertTrue(MoodState::where('text', $text)->exists());
        }
    }
}
