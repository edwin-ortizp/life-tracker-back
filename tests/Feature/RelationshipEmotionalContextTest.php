<?php

namespace Tests\Feature;

use App\Livewire\Relationship\RelationshipEvents;
use App\Livewire\Relationship\RelationshipIndex;
use App\Livewire\Relationship\RelationshipShow;
use App\Models\MoodEntry;
use App\Models\MoodReflection;
use App\Models\MoodState;
use App\Models\Relationship;
use App\Models\User;
use App\Support\DefaultMoodStates;
use App\Support\RelationshipEmotionalPatterns;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Livewire\Livewire;
use Tests\TestCase;

class RelationshipEmotionalContextTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Relationship $alison;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-08-04 09:00:00');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        DefaultMoodStates::createFor($this->user);

        $this->alison = Relationship::factory()->create([
            'user_id' => $this->user->id,
            'full_name' => 'Alison Restrepo',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function linkedEntry(string $emotion, array $attributes = [], ?Relationship $to = null): MoodEntry
    {
        $entry = MoodEntry::factory()
            ->forState(MoodState::firstWhere('text', $emotion))
            ->create(['date' => '2026-08-01', ...$attributes]);

        $entry->linkRelationship($to ?? $this->alison);

        return $entry;
    }

    public function test_linked_entries_appear_in_the_relationship_detail(): void
    {
        $this->linkedEntry('Frustración', ['intensity' => 4, 'situation' => 'Discutí con Alison']);

        Livewire::test(RelationshipShow::class, ['relationship' => $this->alison->id])
            ->assertSee('Experiencias emocionales vinculadas')
            ->assertSee('Frustración')
            ->assertSee('Intensidad 4/5')
            ->assertSee('Discutí con Alison')
            ->assertSee('01/08/2026');
    }

    public function test_a_relationship_without_linked_entries_says_so(): void
    {
        Livewire::test(RelationshipShow::class, ['relationship' => $this->alison->id])
            ->assertSee('Sin experiencias emocionales vinculadas')
            ->assertSee('0 registros');
    }

    public function test_one_entry_can_involve_several_people(): void
    {
        $dad = Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Mi papá']);
        $entry = $this->linkedEntry('Gratitud', ['situation' => 'Mi papá me hizo un favor']);
        $entry->linkRelationship($dad);

        foreach ([$this->alison, $dad] as $person) {
            Livewire::test(RelationshipShow::class, ['relationship' => $person->id])
                ->assertSee('Gratitud')
                ->assertSee('Mi papá me hizo un favor');
        }

        // A single entry is shared by both people; it is never duplicated per person.
        $this->assertDatabaseCount('mood_entries', 1);
    }

    public function test_reflection_content_stays_collapsed_until_the_owner_opens_it(): void
    {
        $entry = $this->linkedEntry('Frustración', ['intensity' => 4]);
        $reflection = new MoodReflection([
            'mood_entry_id' => $entry->id,
            'automatic_thought' => 'Pensamiento muy privado',
            'balanced_perspective' => 'Perspectiva muy privada',
        ]);
        $reflection->user_id = $this->user->id;
        $reflection->save();

        Livewire::test(RelationshipShow::class, ['relationship' => $this->alison->id])
            ->assertSee('Ver reflexión')
            ->assertDontSee('Pensamiento muy privado')
            ->assertDontSee('Perspectiva muy privada')
            ->call('toggleReflection', $entry->id)
            ->assertSee('Pensamiento muy privado')
            ->assertSee('Perspectiva muy privada')
            ->call('toggleReflection', $entry->id)
            ->assertDontSee('Pensamiento muy privado');
    }

    public function test_unlinking_keeps_the_entry_and_its_reflection(): void
    {
        $entry = $this->linkedEntry('Frustración');
        $reflection = new MoodReflection(['mood_entry_id' => $entry->id, 'automatic_thought' => 'Privado']);
        $reflection->user_id = $this->user->id;
        $reflection->save();

        Livewire::test(RelationshipShow::class, ['relationship' => $this->alison->id])
            ->call('unlinkMoodEntry', $entry->id)
            ->assertSee('Sin experiencias emocionales vinculadas');

        $this->assertDatabaseHas('mood_entries', ['id' => $entry->id]);
        $this->assertDatabaseCount('mood_reflections', 1);
        $this->assertDatabaseCount('mood_entry_relationship', 0);
    }

    public function test_deleting_a_relationship_keeps_the_entries_and_reflections(): void
    {
        $entry = $this->linkedEntry('Frustración');
        $reflection = new MoodReflection(['mood_entry_id' => $entry->id, 'automatic_thought' => 'Privado']);
        $reflection->user_id = $this->user->id;
        $reflection->save();

        Livewire::test(RelationshipIndex::class)->call('delete', $this->alison->id);

        $this->assertDatabaseMissing('relationships', ['id' => $this->alison->id]);
        $this->assertDatabaseHas('mood_entries', ['id' => $entry->id]);
        $this->assertDatabaseCount('mood_reflections', 1);
        $this->assertDatabaseCount('mood_entry_relationship', 0);
    }

    public function test_emotional_entries_never_appear_in_the_global_events_view(): void
    {
        $this->linkedEntry('Frustración', ['situation' => 'Discutí con Alison']);

        Livewire::test(RelationshipEvents::class)
            ->set('periodFilter', 'all')
            ->assertDontSee('Frustración')
            ->assertDontSee('Discutí con Alison');

        // Linking never creates a timeline event.
        $this->assertDatabaseCount('relationship_events', 0);
    }

    public function test_emotional_entries_never_appear_on_the_relationship_list_cards(): void
    {
        $this->linkedEntry('Frustración', ['situation' => 'Discutí con Alison']);

        Livewire::test(RelationshipIndex::class)
            ->assertSee('Alison Restrepo')
            ->assertDontSee('Discutí con Alison')
            ->assertDontSee('Frustración');
    }

    public function test_a_user_cannot_reach_the_emotional_context_of_another_user(): void
    {
        $other = User::factory()->create();
        $foreign = Relationship::factory()->create(['user_id' => $other->id, 'full_name' => 'Persona Ajena']);
        $foreignEntry = MoodEntry::factory()->create(['user_id' => $other->id, 'situation' => 'Contexto ajeno']);
        $foreignEntry->linkRelationship($foreign);

        Livewire::test(RelationshipShow::class, ['relationship' => $this->alison->id])
            ->assertDontSee('Contexto ajeno');

        $this->expectException(ModelNotFoundException::class);
        Livewire::test(RelationshipShow::class, ['relationship' => $this->alison->id])
            ->call('unlinkMoodEntry', $foreignEntry->id);
    }

    public function test_patterns_count_emotions_and_show_the_sample_size(): void
    {
        $this->linkedEntry('Frustración', ['date' => '2026-08-01', 'intensity' => 4]);
        $this->linkedEntry('Frustración', ['date' => '2026-07-28', 'intensity' => 2]);
        $this->linkedEntry('Gratitud', ['date' => '2026-07-20']);

        $summary = RelationshipEmotionalPatterns::summarize($this->alison, 30);

        $this->assertSame(3, $summary['sample_size']);
        $this->assertSame('Frustración', $summary['emotions'][0]['text']);
        $this->assertSame(2, $summary['emotions'][0]['count']);
        $this->assertSame(2, $summary['intensity']['recorded']);
        $this->assertSame(3.0, $summary['intensity']['average']);
        $this->assertSame(1, $summary['intensity']['distribution'][4]);
    }

    public function test_the_period_limits_the_sample(): void
    {
        $this->linkedEntry('Frustración', ['date' => '2026-08-03']);
        $this->linkedEntry('Gratitud', ['date' => '2026-05-01']);

        $this->assertSame(1, RelationshipEmotionalPatterns::summarize($this->alison, 7)['sample_size']);
        $this->assertSame(1, RelationshipEmotionalPatterns::summarize($this->alison, 30)['sample_size']);
        $this->assertSame(2, RelationshipEmotionalPatterns::summarize($this->alison, 365)['sample_size']);
    }

    public function test_the_before_and_after_comparison_reports_its_own_sample_size(): void
    {
        $decreased = $this->linkedEntry('Frustración', ['date' => '2026-08-01', 'intensity' => 5]);
        $unchanged = $this->linkedEntry('Frustración', ['date' => '2026-08-02', 'intensity' => 3]);
        $this->linkedEntry('Gratitud', ['date' => '2026-08-03', 'intensity' => 2]);

        foreach ([[$decreased, 2], [$unchanged, 3]] as [$entry, $after]) {
            $reflection = new MoodReflection(['mood_entry_id' => $entry->id, 'intensity_after' => $after]);
            $reflection->user_id = $this->user->id;
            $reflection->save();
        }

        $shift = RelationshipEmotionalPatterns::summarize($this->alison, 30)['reflection_shift'];

        $this->assertSame(2, $shift['sample_size'], 'Only reflections with both numbers count.');
        $this->assertSame(1, $shift['decreased']);
        $this->assertSame(1, $shift['unchanged']);
        $this->assertSame(0, $shift['increased']);
    }

    public function test_the_pattern_view_describes_records_without_attributing_causality(): void
    {
        $this->linkedEntry('Frustración', ['date' => '2026-08-01', 'intensity' => 4]);
        $this->linkedEntry('Frustración', ['date' => '2026-08-02', 'intensity' => 3]);

        $component = Livewire::test(RelationshipShow::class, ['relationship' => $this->alison->id])
            ->assertSee('Registraste Frustración en 2 interacciones vinculadas con Alison Restrepo')
            ->assertSee('2 registros en la muestra');

        foreach ([
            'Alison te causa', 'te causa frustración', 'culpa de', 'puntaje', 'calidad de la relación',
            'relación tóxica', 'compatibilidad',
        ] as $forbidden) {
            $component->assertDontSee($forbidden);
        }
    }

    public function test_the_pattern_period_can_be_changed_from_the_detail(): void
    {
        $this->linkedEntry('Frustración', ['date' => '2026-08-03']);
        $this->linkedEntry('Gratitud', ['date' => '2026-05-01']);

        Livewire::test(RelationshipShow::class, ['relationship' => $this->alison->id])
            ->assertSee('1 registro en la muestra')
            ->call('setPatternDays', 365)
            ->assertSet('patternDays', 365)
            ->assertSee('2 registros en la muestra')
            ->call('setPatternDays', 999)
            // An unsupported period falls back to the default instead of failing.
            ->assertSet('patternDays', 30);
    }

    public function test_a_period_with_no_records_reports_an_empty_sample(): void
    {
        Livewire::test(RelationshipShow::class, ['relationship' => $this->alison->id])
            ->assertSee('0 registros en la muestra')
            ->assertSee('No hay registros vinculados en este periodo');
    }
}
