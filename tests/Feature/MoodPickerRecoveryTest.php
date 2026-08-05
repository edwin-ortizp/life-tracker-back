<?php

namespace Tests\Feature;

use App\Livewire\Home\Dashboard;
use App\Livewire\Journal\JournalMoodRail;
use App\Livewire\Mood\MoodTracker;
use App\Models\IntegrationToken;
use App\Models\MoodEntry;
use App\Models\MoodState;
use App\Models\User;
use App\Support\DefaultMoodStates;
use App\Support\MoodCatalog;
use App\Support\MoodLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class MoodPickerRecoveryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_the_compact_picker_puts_pinned_emotions_before_recent_and_frequent_ones(): void
    {
        DefaultMoodStates::createFor($this->user);
        $catalog = app(MoodCatalog::class);
        $logger = app(MoodLogger::class);

        $happy = MoodState::firstWhere('default_key', 'feliz');
        $worry = MoodState::firstWhere('default_key', 'preocupacion');
        $relief = MoodState::firstWhere('default_key', 'alivio');

        $logger->record($happy);

        $catalog->togglePin($relief);
        $catalog->togglePin($worry);
        $catalog->move($worry->fresh(), -1);

        $picker = $logger->prioritizedStates();

        $this->assertSame(
            ['Preocupación', 'Alivio', 'Feliz'],
            $picker->take(3)->pluck('text')->all()
        );
    }

    public function test_pinning_more_emotions_than_the_picker_holds_keeps_the_chosen_order(): void
    {
        DefaultMoodStates::createFor($this->user);
        $catalog = app(MoodCatalog::class);

        $pinned = MoodState::prioritized()->take(MoodLogger::PICKER_SIZE + 3)->get();
        foreach ($pinned as $state) {
            $catalog->togglePin($state);
        }

        $picker = app(MoodLogger::class)->prioritizedStates();

        $this->assertCount(MoodLogger::PICKER_SIZE, $picker);
        $this->assertSame(
            $pinned->take(MoodLogger::PICKER_SIZE)->pluck('text')->all(),
            $picker->pluck('text')->all(),
            'The overflow stays reachable in the full catalog instead of reordering the picker.'
        );
    }

    public function test_inactive_emotions_leave_the_picker_and_the_full_catalog(): void
    {
        DefaultMoodStates::createFor($this->user);
        $worry = MoodState::firstWhere('default_key', 'preocupacion');
        app(MoodCatalog::class)->togglePin($worry);

        app(MoodCatalog::class)->setActive($worry->fresh(), false);
        $logger = app(MoodLogger::class);

        $this->assertFalse($logger->prioritizedStates()->contains('id', $worry->id));
        $this->assertFalse($logger->catalog()->contains('id', $worry->id));
        $this->assertTrue($logger->hasActiveStates());
    }

    public function test_a_previously_used_emotion_stops_being_suggested_once_deactivated(): void
    {
        DefaultMoodStates::createFor($this->user);
        $happy = MoodState::firstWhere('default_key', 'feliz');
        app(MoodLogger::class)->record($happy);

        app(MoodCatalog::class)->setActive($happy, false);

        $this->assertFalse(app(MoodLogger::class)->prioritizedStates()->contains('id', $happy->id));
        $this->assertSame(1, MoodEntry::count(), 'The entry it produced is untouched.');
    }

    public function test_with_every_emotion_inactive_the_three_surfaces_offer_recovery(): void
    {
        DefaultMoodStates::createFor($this->user);
        MoodState::query()->update(['is_active' => false]);

        $this->assertFalse(app(MoodLogger::class)->hasActiveStates());

        foreach ([MoodTracker::class, Dashboard::class] as $component) {
            Livewire::test($component)
                ->assertSee('Aún no hay emociones para registrar')
                ->assertSee('Restaurar catálogo');
        }

        Livewire::test(JournalMoodRail::class, ['selectedDate' => now()->toDateString()])
            ->assertSee('Aún no hay emociones para registrar');

        $this->assertSame(0, MoodState::active()->count(), 'Nothing is restored on its own.');
    }

    public function test_each_surface_can_restore_the_catalog_without_creating_entries(): void
    {
        $surfaces = [
            [MoodTracker::class, []],
            [Dashboard::class, []],
            [JournalMoodRail::class, ['selectedDate' => now()->toDateString()]],
        ];

        foreach ($surfaces as [$component, $params]) {
            MoodState::query()->delete();

            Livewire::test($component, $params)->call('restoreMoodCatalog');

            $this->assertSame(count(DefaultMoodStates::all()), MoodState::active()->count());
            $this->assertSame(0, MoodEntry::count(), 'Recovering a catalog never invents history.');
        }
    }

    public function test_the_integration_endpoint_lists_only_active_emotions(): void
    {
        DefaultMoodStates::createFor($this->user);
        $worry = MoodState::firstWhere('default_key', 'preocupacion');
        $entry = MoodEntry::factory()->forState($worry)->create();
        app(MoodCatalog::class)->setActive($worry, false);

        [, $token] = IntegrationToken::issueFor($this->user, 'Obsidian / n8n');
        $response = $this->withToken($token)->getJson('/api/v1/integrations/mood-states');

        $response->assertOk();
        $texts = collect($response->json('data'))->pluck('text');

        $this->assertFalse($texts->contains('Preocupación'));
        $this->assertCount(count(DefaultMoodStates::all()) - 1, $texts);
        $this->assertSame('Preocupación', $entry->fresh()->text, 'History reads from its own snapshot.');
    }
}
