<?php

namespace Tests\Feature;

use App\Livewire\Home\Dashboard;
use App\Livewire\Journal\JournalMoodRail;
use App\Livewire\Mood\MoodReflectionWizard;
use App\Livewire\Mood\MoodTracker;
use App\Livewire\Relationship\RelationshipShow;
use App\Models\MoodEntry;
use App\Models\MoodReflection;
use App\Models\MoodState;
use App\Models\Relationship;
use App\Models\User;
use App\Support\DefaultMoodStates;
use App\Support\ReflectionSteps;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Livewire\Livewire;
use Tests\TestCase;

/**
 * End-to-end walkthrough of the three reference flows, with and without a reflection,
 * plus the one-tap guarantee on all three logging surfaces.
 */
class EmotionalWalkthroughTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-08-04 09:00:00');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        DefaultMoodStates::createFor($this->user);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_logging_a_prioritized_emotion_is_a_single_call_on_every_surface(): void
    {
        $state = MoodState::firstWhere('text', 'Feliz');

        // Ánimo
        Livewire::test(MoodTracker::class)->call('saveMood', $state->id);
        // Inicio
        Livewire::test(Dashboard::class)->call('saveMood', $state->id);
        // Diario
        Livewire::test(JournalMoodRail::class, ['selectedDate' => '2026-08-04'])->call('saveMood', $state->id);

        $this->assertDatabaseCount('mood_entries', 3);
        $this->assertSame(3, MoodEntry::whereNull('situation')->whereNull('intensity')->count());
        $this->assertDatabaseCount('mood_reflections', 0);
    }

    public function test_the_argument_with_alison_flows_from_one_tap_to_a_full_reflection(): void
    {
        $alison = Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Alison Restrepo']);
        $frustration = MoodState::firstWhere('text', 'Frustración');

        // 1. One tap in Ánimo.
        $mood = Livewire::test(MoodTracker::class)
            ->call('saveMood', $frustration->id)
            ->assertSee('Registraste “Frustración”');

        $entry = MoodEntry::firstWhere('text', 'Frustración');

        // 2. Context added on purpose from the confirmation.
        $mood->call('openMoodContext')
            ->set('contextSituation', 'Discutí con Alison')
            ->call('setContextIntensity', 4)
            ->call('toggleContextRelationship', $alison->id)
            ->call('saveMoodContext')
            ->assertHasNoErrors();

        $entry->refresh();
        $this->assertSame('Discutí con Alison', $entry->situation);
        $this->assertSame(4, $entry->intensity);
        $this->assertSame(['Alison Restrepo'], $entry->relationships->pluck('full_name')->all());

        // 3. A reflection is started on purpose and completed.
        Livewire::test(MoodReflectionWizard::class, ['entryId' => $entry->id])
            ->assertSet('step', ReflectionSteps::SITUATION)
            ->set('answer', 'Discutí con Alison')->call('continue')
            ->set('answer', 'Nunca me escucha')->call('continue')
            ->set('answer', 'Levantó la voz')->call('continue')
            ->set('answer', 'Otras veces sí me escuchó')->call('continue')
            ->set('answer', 'Fue una discusión puntual')->call('continue')
            ->call('setScaleAnswer', 2)->call('continue')
            ->set('answer', 'Hablarlo con calma mañana')->call('complete')
            ->assertSet('showSummary', true);

        $reflection = MoodReflection::firstWhere('mood_entry_id', $entry->id);
        $this->assertSame(MoodReflection::STATUS_COMPLETED, $reflection->status);
        $this->assertSame(2, $reflection->intensity_after);

        // 4. It shows up in Alison's detail, with the reflection collapsed.
        Livewire::test(RelationshipShow::class, ['relationship' => $alison->id])
            ->assertSee('Frustración')
            ->assertSee('Discutí con Alison')
            ->assertSee('Intensidad 4/5')
            ->assertDontSee('Nunca me escucha')
            ->call('toggleReflection', $entry->id)
            ->assertSee('Nunca me escucha')
            ->assertSee('Registraste Frustración en 1 interacción vinculada con Alison Restrepo');

        // The emotional entry never became a timeline event.
        $this->assertDatabaseCount('relationship_events', 0);
    }

    public function test_the_favour_from_dad_stays_a_short_note_without_any_reflection(): void
    {
        $dad = Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Mi papá']);
        $gratitude = MoodState::firstWhere('text', 'Gratitud');

        Livewire::test(Dashboard::class)
            ->call('openMoodCatalog')
            ->call('logMood', $gratitude->id)
            ->call('openMoodContext')
            ->set('contextSituation', 'Mi papá me hizo un favor')
            ->call('toggleContextRelationship', $dad->id)
            ->call('saveMoodContext')
            ->assertHasNoErrors();

        $entry = MoodEntry::firstWhere('text', 'Gratitud');

        $this->assertSame('Mi papá me hizo un favor', $entry->situation);
        $this->assertNull($entry->intensity, 'Intensity stays empty because it was never given.');
        $this->assertNull($entry->reflection);
        $this->assertDatabaseCount('mood_reflections', 0);

        Livewire::test(RelationshipShow::class, ['relationship' => $dad->id])
            ->assertSee('Mi papá me hizo un favor')
            ->assertDontSee('Ver reflexión');
    }

    public function test_the_fall_of_the_grandmother_can_be_reflected_on_across_two_sessions(): void
    {
        $grandmother = Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Mi abuela']);
        $worry = MoodState::firstWhere('text', 'Preocupación');

        Livewire::test(JournalMoodRail::class, ['selectedDate' => '2026-08-04'])
            ->call('openMoodCatalog')
            ->call('logMood', $worry->id)
            ->call('openMoodContext')
            ->set('contextSituation', 'Mi abuela se cayó')
            ->call('setContextIntensity', 5)
            ->call('toggleContextRelationship', $grandmother->id)
            ->call('saveMoodContext');

        $entry = MoodEntry::firstWhere('text', 'Preocupación');

        // First session: a couple of answers, then "Terminar por ahora".
        Livewire::test(MoodReflectionWizard::class, ['entryId' => $entry->id])
            ->call('skip')
            ->set('answer', 'Y si le pasa algo peor')->call('continue')
            ->call('finishForNow')
            ->assertDispatched('reflection-closed');

        $reflection = MoodReflection::firstWhere('mood_entry_id', $entry->id);
        $this->assertSame(MoodReflection::STATUS_DRAFT, $reflection->status);
        $this->assertSame(ReflectionSteps::EVIDENCE_FOR, $reflection->current_step);

        // Second session: it resumes exactly where it stopped.
        Livewire::test(MoodReflectionWizard::class, ['entryId' => $entry->id])
            ->assertSet('step', ReflectionSteps::EVIDENCE_FOR)
            ->call('skip')->call('skip')->call('skip')
            ->assertSet('step', ReflectionSteps::INTENSITY_AFTER)
            ->call('setScaleAnswer', 5)
            ->call('continue')
            ->call('complete');

        $reflection->refresh();
        $this->assertSame(MoodReflection::STATUS_COMPLETED, $reflection->status);
        $this->assertSame('Y si le pasa algo peor', $reflection->automatic_thought);
        // An unchanged intensity is a valid outcome, never framed as a failure.
        $this->assertSame(5, $reflection->intensity_after);
        $this->assertSame(5, $entry->fresh()->intensity);

        Livewire::test(RelationshipShow::class, ['relationship' => $grandmother->id])
            ->assertSee('Mi abuela se cayó')
            ->assertSee('1 registro en la muestra')
            ->assertSee('1 sin cambio');
    }
}
