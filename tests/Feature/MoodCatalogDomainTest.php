<?php

namespace Tests\Feature;

use App\Models\MoodEntry;
use App\Models\MoodState;
use App\Models\User;
use App\Support\DefaultMoodStates;
use App\Support\MoodCatalog;
use App\Support\MoodCatalogRestorer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class MoodCatalogDomainTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private MoodCatalog $catalog;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        $this->catalog = app(MoodCatalog::class);
    }

    public function test_initialization_is_idempotent_and_keyed_by_stable_identifiers(): void
    {
        $restorer = app(MoodCatalogRestorer::class);

        $first = $restorer->syncDefaults($this->user);
        $second = $restorer->syncDefaults($this->user);

        $this->assertSame(count(DefaultMoodStates::all()), $first['created']);
        $this->assertSame(0, $second['created']);
        $this->assertSame(count(DefaultMoodStates::all()), MoodState::count());
        $this->assertSame('preocupacion', MoodState::firstWhere('text', 'Preocupación')->default_key);
    }

    public function test_a_renamed_default_keeps_its_key_and_is_not_recreated(): void
    {
        DefaultMoodStates::createFor($this->user);
        $worry = MoodState::firstWhere('default_key', 'preocupacion');

        $this->catalog->update($worry, ['emoji' => '🫠', 'text' => 'Inquietud', 'category' => 'Mental', 'value' => 4]);
        $summary = $this->catalog->restore($this->user);

        $this->assertSame(0, $summary['created'], 'A renamed default is still recognized by its key.');
        $this->assertSame(count(DefaultMoodStates::all()), MoodState::count());
        $this->assertSame('Inquietud', $worry->fresh()->text);
    }

    public function test_restoring_recreates_missing_defaults_and_reactivates_the_inactive_ones(): void
    {
        DefaultMoodStates::createFor($this->user);
        $custom = $this->catalog->create($this->user, ['emoji' => '🦄', 'text' => 'Mi estado', 'category' => 'Emocional', 'value' => 7]);
        MoodState::firstWhere('default_key', 'triste')->delete();
        $this->catalog->setActive(MoodState::firstWhere('default_key', 'feliz'), false);

        $summary = $this->catalog->restore($this->user);

        $this->assertSame(1, $summary['created']);
        $this->assertSame(1, $summary['reactivated']);
        $this->assertTrue(MoodState::firstWhere('default_key', 'feliz')->is_active);
        $this->assertNotNull(MoodState::firstWhere('default_key', 'triste'));
        $this->assertNotNull($custom->fresh(), 'Restaurar is not a destructive reset.');
    }

    public function test_editing_an_emotion_never_rewrites_the_entries_already_logged(): void
    {
        $state = MoodState::factory()->create(['user_id' => $this->user->id, 'emoji' => '😟', 'text' => 'Preocupación', 'value' => 3]);
        $entry = MoodEntry::factory()->forState($state)->create();

        $this->catalog->update($state, ['emoji' => '🫠', 'text' => 'Inquietud', 'category' => 'Mental', 'value' => 5]);

        $entry->refresh();
        $this->assertSame('😟', $entry->emoji);
        $this->assertSame('Preocupación', $entry->text);
        $this->assertSame(3, $entry->value);
        $this->assertSame('Inquietud', $state->fresh()->text);
    }

    public function test_validation_rejects_a_repeated_name_a_bad_category_and_an_out_of_range_valence(): void
    {
        MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Calma']);

        $validator = Validator::make(
            ['emoji' => 'ok', 'text' => 'Calma', 'category' => 'Espiritual', 'value' => 11],
            $this->catalog->rules($this->user)
        );

        $this->assertSame(
            ['emoji', 'text', 'category', 'value'],
            array_keys($validator->errors()->messages())
        );
    }

    public function test_validation_accepts_a_valid_emotion_and_the_same_name_for_another_user(): void
    {
        $other = User::factory()->create();
        MoodState::factory()->create(['user_id' => $other->id, 'text' => 'Calma']);

        $validator = Validator::make(
            ['emoji' => '🌊', 'text' => 'Calma', 'category' => 'Emocional', 'value' => 8],
            $this->catalog->rules($this->user)
        );

        $this->assertFalse($validator->fails(), 'Names are only unique inside one catalog.');
    }

    public function test_deactivating_keeps_the_pin_and_hides_the_emotion_from_new_records(): void
    {
        $state = MoodState::factory()->create(['user_id' => $this->user->id]);
        $this->catalog->togglePin($state);

        $this->catalog->setActive($state->fresh(), false);

        $state->refresh();
        $this->assertFalse($state->is_active);
        $this->assertTrue($state->is_pinned, 'The preference survives so reactivating restores the position.');
        $this->assertSame(0, MoodState::active()->count());
    }

    public function test_pinned_emotions_are_ordered_before_the_rest(): void
    {
        $joy = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Alegría', 'value' => 10]);
        $worry = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Preocupación', 'value' => 3]);
        $calm = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Calma', 'value' => 8]);

        $this->catalog->togglePin($calm);
        $this->catalog->togglePin($worry);

        $this->assertSame(
            ['Calma', 'Preocupación', 'Alegría'],
            MoodState::prioritized()->pluck('text')->all()
        );

        $this->catalog->move($worry->fresh(), -1);

        $this->assertSame(
            ['Preocupación', 'Calma', 'Alegría'],
            MoodState::prioritized()->pluck('text')->all()
        );
        $this->assertSame('Alegría', $joy->text);
    }

    public function test_unpinning_returns_an_emotion_to_the_valence_ranking(): void
    {
        $worry = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Preocupación', 'value' => 3]);
        MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Alegría', 'value' => 10]);

        $this->catalog->togglePin($worry);
        $this->catalog->togglePin($worry->fresh());

        $this->assertSame(['Alegría', 'Preocupación'], MoodState::prioritized()->pluck('text')->all());
    }

    public function test_only_an_unused_custom_emotion_can_be_deleted(): void
    {
        DefaultMoodStates::createFor($this->user);
        $unused = $this->catalog->create($this->user, ['emoji' => '🦄', 'text' => 'Sin usar', 'category' => 'Emocional', 'value' => 7]);
        $used = $this->catalog->create($this->user, ['emoji' => '🌊', 'text' => 'En uso', 'category' => 'Emocional', 'value' => 6]);
        MoodEntry::factory()->forState($used)->create();
        $default = MoodState::firstWhere('default_key', 'feliz');

        $this->assertTrue($this->catalog->delete($unused));
        $this->assertFalse($this->catalog->delete($used), 'An emotion with history is deactivated, never deleted.');
        $this->assertFalse($this->catalog->delete($default), 'A default is always recoverable.');

        $this->assertNull($unused->fresh());
        $this->assertNotNull($used->fresh());
        $this->assertNotNull($default->fresh());
    }

    public function test_the_catalog_of_another_user_is_never_visible_or_reachable(): void
    {
        $other = User::factory()->create();
        $foreign = MoodState::factory()->create(['user_id' => $other->id, 'text' => 'Ajena']);
        DefaultMoodStates::createFor($this->user);

        $this->assertNull(MoodState::find($foreign->id));
        $this->assertSame(count(DefaultMoodStates::all()), MoodState::count());

        $this->catalog->restore($this->user);

        $this->assertSame('Ajena', $foreign->fresh()->text);
        $this->assertSame(
            1,
            MoodState::withoutGlobalScopes()->where('user_id', $other->id)->count(),
            'Repairing one catalog never touches another.'
        );
    }
}
