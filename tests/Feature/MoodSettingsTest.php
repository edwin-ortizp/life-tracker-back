<?php

namespace Tests\Feature;

use App\Livewire\Mood\MoodSettings;
use App\Models\MoodEntry;
use App\Models\MoodState;
use App\Models\User;
use App\Support\DefaultMoodStates;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class MoodSettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_the_module_exposes_a_settings_tab(): void
    {
        DefaultMoodStates::createFor($this->user);

        $this->get(route('mood'))->assertOk()->assertSee(route('mood.settings'), false);
        $this->get(route('mood.settings'))->assertOk()->assertSeeLivewire(MoodSettings::class);
    }

    public function test_a_valid_emotion_is_created_and_becomes_available(): void
    {
        Livewire::test(MoodSettings::class)
            ->call('openForm')
            ->set('emoji', '🌊')
            ->set('text', 'Calma')
            ->set('formCategory', 'Emocional')
            ->set('value', 8)
            ->call('save')
            ->assertHasNoErrors()
            ->assertSet('showForm', false);

        $state = MoodState::firstWhere('text', 'Calma');

        $this->assertNotNull($state);
        $this->assertTrue($state->is_active);
        $this->assertNull($state->default_key, 'A user-made emotion is never a default.');
    }

    public function test_a_repeated_name_and_a_non_emoji_are_rejected(): void
    {
        MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Calma']);

        Livewire::test(MoodSettings::class)
            ->call('openForm')
            ->set('emoji', 'wow')
            ->set('text', 'Calma')
            ->set('value', 12)
            ->call('save')
            ->assertHasErrors(['emoji', 'text', 'value']);

        $this->assertSame(1, MoodState::count());
    }

    public function test_editing_updates_the_catalog_without_rewriting_the_history(): void
    {
        $state = MoodState::factory()->create([
            'user_id' => $this->user->id, 'emoji' => '😟', 'text' => 'Preocupación', 'value' => 3,
        ]);
        $entry = MoodEntry::factory()->forState($state)->create();

        Livewire::test(MoodSettings::class)
            ->call('openForm', $state->id)
            ->assertSet('text', 'Preocupación')
            ->set('emoji', '🫠')
            ->set('text', 'Inquietud')
            ->set('formCategory', 'Mental')
            ->set('value', 5)
            ->call('save')
            ->assertHasNoErrors();

        $this->assertSame('Inquietud', $state->fresh()->text);
        $this->assertSame('Preocupación', $entry->fresh()->text);
        $this->assertSame('😟', $entry->fresh()->emoji);
    }

    public function test_search_and_filters_narrow_the_list(): void
    {
        MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Calma', 'category' => 'Emocional']);
        MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Enfoque', 'category' => 'Mental']);
        MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Cansancio', 'category' => 'Físico', 'is_active' => false]);

        Livewire::test(MoodSettings::class)
            ->set('search', 'Cal')
            ->assertSee('Calma')->assertDontSee('Enfoque')
            ->set('search', '')
            ->set('category', 'Mental')
            ->assertSee('Enfoque')->assertDontSee('Calma')
            ->set('category', '')
            ->set('status', 'inactive')
            ->assertSee('Cansancio')->assertDontSee('Enfoque');
    }

    public function test_deactivating_hides_an_emotion_from_new_records_and_keeps_its_entries(): void
    {
        $state = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Preocupación']);
        $entry = MoodEntry::factory()->forState($state)->create();

        Livewire::test(MoodSettings::class)->call('toggleActive', $state->id);

        $this->assertFalse($state->fresh()->is_active);
        $this->assertSame(0, MoodState::active()->count());
        $this->assertNotNull($entry->fresh());

        Livewire::test(MoodSettings::class)->call('toggleActive', $state->id);

        $this->assertTrue($state->fresh()->is_active);
    }

    public function test_pinning_and_reordering_drive_the_quick_picker(): void
    {
        $joy = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Alegría', 'value' => 10]);
        $worry = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Preocupación', 'value' => 3]);

        Livewire::test(MoodSettings::class)
            ->call('togglePin', $joy->id)
            ->call('togglePin', $worry->id)
            ->call('move', $worry->id, -1);

        $this->assertSame(
            ['Preocupación', 'Alegría'],
            MoodState::prioritized()->pluck('text')->all()
        );
    }

    public function test_only_an_unused_custom_emotion_offers_deletion(): void
    {
        DefaultMoodStates::createFor($this->user);
        $unused = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Sin usar']);
        $used = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'En uso']);
        MoodEntry::factory()->forState($used)->create();

        Livewire::test(MoodSettings::class)
            ->call('delete', $unused->id)
            ->call('delete', $used->id)
            ->assertSee('desactívala');

        $this->assertNull($unused->fresh());
        $this->assertNotNull($used->fresh());
    }

    public function test_restoring_reports_what_it_created_and_reactivated(): void
    {
        DefaultMoodStates::createFor($this->user);
        MoodState::firstWhere('default_key', 'triste')->delete();
        MoodState::firstWhere('default_key', 'feliz')->update(['is_active' => false]);
        $custom = MoodState::factory()->create(['user_id' => $this->user->id, 'text' => 'Mi estado']);

        Livewire::test(MoodSettings::class)
            ->call('confirmRestore')
            ->assertSet('showRestoreConfirm', true)
            ->call('restoreDefaults')
            ->assertSet('showRestoreConfirm', false)
            ->assertSee('1 creadas y 1 reactivadas');

        $this->assertNotNull(MoodState::firstWhere('default_key', 'triste'));
        $this->assertTrue(MoodState::firstWhere('default_key', 'feliz')->is_active);
        $this->assertNotNull($custom->fresh());
    }

    public function test_an_identifier_from_another_user_is_refused_without_leaking_data(): void
    {
        $other = User::factory()->create();
        $foreign = MoodState::factory()->create(['user_id' => $other->id, 'text' => 'Ajena', 'emoji' => '🛸']);

        Livewire::test(MoodSettings::class)
            ->call('openForm', $foreign->id)
            ->assertSet('editingId', null)
            ->assertSet('text', '')
            ->call('toggleActive', $foreign->id)
            ->assertSee('ya no está disponible')
            ->call('delete', $foreign->id)
            ->call('togglePin', $foreign->id)
            ->assertDontSee('Ajena');

        $foreign->refresh();
        $this->assertTrue($foreign->is_active);
        $this->assertFalse($foreign->is_pinned);
        $this->assertNotNull($foreign);
    }
}
