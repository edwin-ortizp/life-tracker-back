<?php

namespace Tests\Feature;

use App\Livewire\Mood\MoodReflectionWizard;
use App\Livewire\Mood\MoodTracker;
use App\Models\MoodEntry;
use App\Models\MoodReflection;
use App\Models\MoodState;
use App\Models\User;
use App\Support\DefaultMoodStates;
use App\Support\ReflectionSteps;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Livewire\Livewire;
use Tests\TestCase;

class GuidedReflectionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private MoodEntry $entry;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-08-04 09:00:00');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        DefaultMoodStates::createFor($this->user);

        $this->entry = MoodEntry::factory()
            ->forState(MoodState::firstWhere('text', 'Frustración'))
            ->create(['date' => '2026-08-04', 'intensity' => 4]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function wizard()
    {
        return Livewire::test(MoodReflectionWizard::class, ['entryId' => $this->entry->id]);
    }

    public function test_saving_an_emotion_never_starts_a_reflection(): void
    {
        $state = MoodState::firstWhere('text', 'Triste');

        Livewire::test(MoodTracker::class)
            ->call('saveMood', $state->id)
            ->assertSet('reflectionEntryId', null);

        $this->assertDatabaseCount('mood_reflections', 0);
    }

    public function test_a_reflection_is_started_explicitly_from_an_entry_in_the_history(): void
    {
        Livewire::test(MoodTracker::class)
            ->call('openReflection', $this->entry->id)
            ->assertSet('reflectionEntryId', $this->entry->id)
            ->assertSee('¿Qué estaba pasando?');

        // Opening it starts a draft attached to that entry, and nothing else.
        $this->assertDatabaseCount('mood_reflections', 1);
        $reflection = MoodReflection::firstWhere('mood_entry_id', $this->entry->id);
        $this->assertSame(MoodReflection::STATUS_DRAFT, $reflection->status);
        $this->assertNull($reflection->automatic_thought);
    }

    public function test_the_wizard_shows_one_question_at_a_time_in_a_fixed_order(): void
    {
        $wizard = $this->wizard()
            ->assertSet('step', ReflectionSteps::SITUATION)
            ->assertSee('¿Qué estaba pasando?')
            ->assertDontSee('¿Qué pensaste en ese momento?')
            ->assertSee('Continuar')
            ->assertSee('Omitir')
            ->assertSee('Terminar por ahora');

        $wizard->set('answer', 'Discutí con Alison')->call('continue')
            ->assertSet('step', ReflectionSteps::AUTOMATIC_THOUGHT)
            ->assertSee('¿Qué pensaste en ese momento?')
            ->assertDontSee('¿Qué estaba pasando?');

        $this->assertSame('Discutí con Alison', $this->entry->fresh()->situation);
    }

    public function test_skipping_advances_without_storing_anything_for_that_step(): void
    {
        $this->wizard()
            ->call('skip')
            ->assertSet('step', ReflectionSteps::AUTOMATIC_THOUGHT)
            ->call('skip')
            ->assertSet('step', ReflectionSteps::EVIDENCE_FOR);

        $reflection = MoodReflection::firstWhere('mood_entry_id', $this->entry->id);
        $this->assertNull($this->entry->fresh()->situation);
        $this->assertNull($reflection->automatic_thought);
    }

    public function test_each_advance_autosaves_the_answer_and_the_step_to_resume_from(): void
    {
        $this->wizard()
            ->set('answer', 'Discutí con Alison')->call('continue')
            ->set('answer', 'No me escucha')->call('continue');

        $reflection = MoodReflection::firstWhere('mood_entry_id', $this->entry->id);

        $this->assertSame('No me escucha', $reflection->automatic_thought);
        $this->assertSame(ReflectionSteps::EVIDENCE_FOR, $reflection->current_step);
        $this->assertSame(MoodReflection::STATUS_DRAFT, $reflection->status);
    }

    public function test_finishing_for_now_keeps_a_draft_and_closes_the_wizard(): void
    {
        $this->wizard()
            ->set('answer', 'Discutí con Alison')->call('continue')
            ->set('answer', 'No me escucha')
            ->call('finishForNow')
            ->assertDispatched('reflection-closed');

        $reflection = MoodReflection::firstWhere('mood_entry_id', $this->entry->id);
        $this->assertSame(MoodReflection::STATUS_DRAFT, $reflection->status);
        $this->assertSame('No me escucha', $reflection->automatic_thought);
        $this->assertNull($reflection->completed_at);
    }

    public function test_a_draft_resumes_at_the_last_pending_step_with_previous_answers_intact(): void
    {
        $this->wizard()
            ->set('answer', 'Discutí con Alison')->call('continue')
            ->set('answer', 'No me escucha')->call('continue')
            ->call('finishForNow');

        $this->wizard()
            ->assertSet('step', ReflectionSteps::EVIDENCE_FOR)
            ->assertSee('¿Qué hechos apoyan ese pensamiento?');

        $reflection = MoodReflection::firstWhere('mood_entry_id', $this->entry->id);
        $this->assertSame('No me escucha', $reflection->automatic_thought);
        $this->assertSame('Discutí con Alison', $this->entry->fresh()->situation);
    }

    public function test_completing_with_skipped_steps_invents_no_content(): void
    {
        $wizard = $this->wizard()
            ->set('answer', 'Discutí con Alison')->call('continue')
            ->call('skip')
            ->call('skip')
            ->call('skip')
            ->set('answer', 'Fue una discusión puntual')->call('continue')
            ->call('skip')
            ->call('skip');

        $wizard->assertSet('showSummary', true)
            ->assertSee('Discutí con Alison')
            ->assertSee('Fue una discusión puntual');

        $reflection = MoodReflection::firstWhere('mood_entry_id', $this->entry->id);
        $this->assertSame(MoodReflection::STATUS_COMPLETED, $reflection->status);
        $this->assertNotNull($reflection->completed_at);
        $this->assertNull($reflection->automatic_thought);
        $this->assertNull($reflection->evidence_for);
        $this->assertNull($reflection->evidence_against);
        $this->assertNull($reflection->next_step);
        $this->assertSame('Fue una discusión puntual', $reflection->balanced_perspective);
    }

    public function test_an_unchanged_intensity_completes_the_reflection_normally(): void
    {
        $wizard = $this->wizard()
            ->call('skip')->call('skip')->call('skip')->call('skip')->call('skip')
            ->assertSet('step', ReflectionSteps::INTENSITY_AFTER)
            ->call('setScaleAnswer', 4)
            ->call('continue')
            ->assertSet('step', ReflectionSteps::NEXT_STEP)
            ->call('complete');

        $reflection = MoodReflection::firstWhere('mood_entry_id', $this->entry->id);

        $this->assertSame(4, $reflection->intensity_after);
        $this->assertSame(4, $this->entry->fresh()->intensity);
        $this->assertSame(MoodReflection::STATUS_COMPLETED, $reflection->status);
        $wizard->assertSee('4 de 5 antes y')->assertDontSee('fracaso');
    }

    public function test_restarting_a_reflection_keeps_the_entry_and_its_context(): void
    {
        $this->entry->update(['situation' => 'Discutí con Alison']);
        $this->wizard()
            ->set('answer', 'Discutí con Alison')->call('continue')
            ->set('answer', 'No me escucha')->call('continue')
            ->call('finishForNow');

        $this->assertDatabaseCount('mood_reflections', 1);

        $this->wizard()->call('restart')->assertSet('step', ReflectionSteps::SITUATION);

        $this->assertDatabaseHas('mood_entries', [
            'id' => $this->entry->id,
            'situation' => 'Discutí con Alison',
            'intensity' => 4,
        ]);
        $this->assertNull(MoodReflection::firstWhere('mood_entry_id', $this->entry->id)?->automatic_thought);
    }

    public function test_deleting_the_entry_deletes_its_reflection(): void
    {
        $this->wizard()->set('answer', 'Discutí con Alison')->call('continue');

        $this->assertDatabaseCount('mood_reflections', 1);

        Livewire::test(MoodTracker::class)->call('deleteMood', $this->entry->id);

        $this->assertDatabaseCount('mood_entries', 0);
        $this->assertDatabaseCount('mood_reflections', 0);
    }

    public function test_the_scope_notice_explains_the_limits_of_the_tool(): void
    {
        $this->wizard()
            ->assertSee('¿Para qué sirve esto?')
            ->call('toggleScope')
            ->assertSee('herramienta de autoobservación')
            ->assertSee('No sustituye la atención de un profesional de salud mental')
            ->assertSee('servicios de emergencia');
    }

    public function test_the_wizard_only_asks_and_never_concludes(): void
    {
        $wizard = $this->wizard()
            ->set('answer', 'Discutí con Alison')->call('continue')
            ->set('answer', 'Nunca me escucha, siempre es lo mismo')->call('continue')
            ->set('answer', 'Levantó la voz')->call('continue')
            ->set('answer', 'Otras veces sí me escuchó')->call('continue')
            ->set('answer', 'Fue una discusión puntual')->call('continue')
            ->call('setScaleAnswer', 2)->call('continue')
            ->set('answer', 'Hablarlo con calma')->call('complete');

        // The summary repeats the user's own words and adds no interpretation.
        $wizard->assertSee('Nunca me escucha, siempre es lo mismo')
            ->assertDontSee('distorsión')
            ->assertDontSee('pensamiento irracional')
            ->assertDontSee('catastrofización')
            ->assertDontSee('generalización')
            ->assertDontSee('diagnóstico')
            ->assertDontSee('trastorno')
            ->assertDontSee('te recomendamos')
            ->assertDontSee('deberías')
            ->assertDontSee('causó');

        $reflection = MoodReflection::firstWhere('mood_entry_id', $this->entry->id);
        $this->assertSame('Nunca me escucha, siempre es lo mismo', $reflection->automatic_thought);
        $this->assertSame('Hablarlo con calma', $reflection->next_step);
    }

    public function test_the_questions_are_fixed_and_contain_no_clinical_language(): void
    {
        $text = collect(ReflectionSteps::definition())
            ->flatMap(fn (array $step) => [$step['question'], $step['hint'], $step['label']])
            ->implode(' ');

        foreach (['diagnóstico', 'trastorno', 'distorsión', 'síntoma', 'terapia', 'tratamiento', 'deberías'] as $forbidden) {
            $this->assertStringNotContainsStringIgnoringCase($forbidden, $text);
        }
    }

    public function test_a_user_cannot_open_a_reflection_belonging_to_someone_else(): void
    {
        $other = User::factory()->create();
        $foreignEntry = MoodEntry::factory()->create(['user_id' => $other->id]);
        $foreignReflection = new MoodReflection([
            'mood_entry_id' => $foreignEntry->id,
            'automatic_thought' => 'Contenido ajeno',
        ]);
        $foreignReflection->user_id = $other->id;
        $foreignReflection->save();

        $this->expectException(ModelNotFoundException::class);
        Livewire::test(MoodReflectionWizard::class, ['entryId' => $foreignEntry->id]);
    }

    public function test_a_user_cannot_open_another_users_reflection_from_the_history(): void
    {
        $other = User::factory()->create();
        $foreignEntry = MoodEntry::factory()->create(['user_id' => $other->id]);

        $this->expectException(ModelNotFoundException::class);
        Livewire::test(MoodTracker::class)->call('openReflection', $foreignEntry->id);
    }
}
