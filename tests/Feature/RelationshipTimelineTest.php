<?php

namespace Tests\Feature;

use App\Livewire\Relationship\RelationshipEvents;
use App\Livewire\Relationship\RelationshipShow;
use App\Models\Relationship;
use App\Models\RelationshipEvent;
use App\Models\User;
use App\Support\EventDate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Livewire\Livewire;
use Tests\TestCase;

class RelationshipTimelineTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Relationship $relationship;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-08-04 09:00:00');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        $this->relationship = Relationship::factory()->create([
            'user_id' => $this->user->id,
            'full_name' => 'Alison Restrepo',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_an_exact_future_event_appears_in_the_timeline_and_in_the_global_view(): void
    {
        Livewire::test(RelationshipShow::class, ['relationship' => $this->relationship->id])
            ->call('openEventForm')
            ->set('eventTitle', 'Graduación')
            ->set('eventCategory', 'education-work')
            ->set('eventPrecision', EventDate::DAY)
            ->set('eventDate', '2026-11-14')
            ->call('saveEvent')
            ->assertHasNoErrors()
            ->assertSee('Graduación')
            ->assertSee('14 de noviembre de 2026');

        Livewire::test(RelationshipEvents::class)
            ->set('periodFilter', 'upcoming')
            ->assertSee('Graduación');
    }

    public function test_a_monthly_event_never_shows_an_invented_day(): void
    {
        Livewire::test(RelationshipShow::class, ['relationship' => $this->relationship->id])
            ->call('openEventForm')
            ->set('eventTitle', 'Graduación')
            ->set('eventPrecision', EventDate::MONTH)
            ->set('eventYear', 2026)
            ->set('eventMonth', 11)
            ->call('saveEvent')
            ->assertHasNoErrors()
            ->assertSee('noviembre de 2026')
            ->assertDontSee('1 de noviembre de 2026');

        $event = RelationshipEvent::firstWhere('title', 'Graduación');
        $this->assertSame('month', $event->date_precision);
        $this->assertSame('2026-11-01', $event->starts_on->toDateString());
        $this->assertSame('2026-11-30', $event->ends_on->toDateString());
    }

    public function test_a_year_only_event_is_shown_as_a_year(): void
    {
        Livewire::test(RelationshipShow::class, ['relationship' => $this->relationship->id])
            ->call('openEventForm')
            ->set('eventTitle', 'Se mudó a Bogotá')
            ->set('eventPrecision', EventDate::YEAR)
            ->set('eventYear', 2019)
            ->call('saveEvent')
            ->assertHasNoErrors();

        $event = RelationshipEvent::firstWhere('title', 'Se mudó a Bogotá');
        $this->assertSame('2019', $event->dateLabel());
    }

    public function test_an_inverted_interval_is_rejected(): void
    {
        Livewire::test(RelationshipShow::class, ['relationship' => $this->relationship->id])
            ->call('openEventForm')
            ->set('eventTitle', 'Viaje')
            ->set('eventPrecision', EventDate::RANGE)
            ->set('eventStartsOn', '2026-06-15')
            ->set('eventEndsOn', '2026-06-01')
            ->call('saveEvent')
            ->assertHasErrors('eventPrecision');

        $this->assertDatabaseMissing('relationship_events', ['title' => 'Viaje']);
    }

    public function test_events_are_ordered_by_the_start_of_their_window(): void
    {
        foreach ([
            ['Café', EventDate::fromInput(EventDate::DAY, date: '2026-01-10')],
            ['Viaje', EventDate::fromInput(EventDate::RANGE, startsOn: '2026-03-01', endsOn: '2026-03-20')],
            ['Cena', EventDate::fromInput(EventDate::DAY, date: '2026-02-05')],
        ] as [$title, $date]) {
            RelationshipEvent::factory()->forRelationship($this->relationship)->on($date)->create(['title' => $title]);
        }

        $ordered = RelationshipEvent::chronological()->pluck('title')->all();

        $this->assertSame(['Café', 'Cena', 'Viaje'], $ordered);
    }

    public function test_sensitive_events_stay_out_of_the_global_view_until_asked_for(): void
    {
        RelationshipEvent::factory()->forRelationship($this->relationship)->sensitive()
            ->on(EventDate::fromInput(EventDate::DAY, date: '2026-09-01'))
            ->create(['title' => 'Cita médica', 'category' => 'health']);
        RelationshipEvent::factory()->forRelationship($this->relationship)
            ->on(EventDate::fromInput(EventDate::DAY, date: '2026-09-02'))
            ->create(['title' => 'Almuerzo familiar']);

        Livewire::test(RelationshipEvents::class)
            ->assertSee('Almuerzo familiar')
            ->assertDontSee('Cita médica')
            ->set('includeSensitive', true)
            ->assertSee('Cita médica');

        $this->get('/relationships/events')->assertOk()->assertDontSee('Cita médica');
    }

    public function test_a_sensitive_event_is_visible_inside_the_relationship_detail(): void
    {
        RelationshipEvent::factory()->forRelationship($this->relationship)->sensitive()
            ->create(['title' => 'Cita médica', 'category' => 'health']);

        Livewire::test(RelationshipShow::class, ['relationship' => $this->relationship->id])
            ->assertSee('Cita médica');
    }

    public function test_events_can_be_archived_unarchived_and_deleted(): void
    {
        $event = RelationshipEvent::factory()->forRelationship($this->relationship)->create(['title' => 'Mudanza']);

        $component = Livewire::test(RelationshipShow::class, ['relationship' => $this->relationship->id])
            ->call('toggleEventArchive', $event->id)
            ->assertDontSee('Mudanza');

        $this->assertTrue($event->fresh()->is_archived);

        $component->set('showArchivedEvents', true)->assertSee('Mudanza');

        $component->call('toggleEventArchive', $event->id);
        $this->assertFalse($event->fresh()->is_archived);

        $component->call('deleteEvent', $event->id);
        $this->assertDatabaseMissing('relationship_events', ['id' => $event->id]);
    }

    public function test_the_global_view_filters_by_relation_category_and_period_through_the_url(): void
    {
        $other = Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Camilo Vargas']);

        RelationshipEvent::factory()->forRelationship($this->relationship)
            ->on(EventDate::fromInput(EventDate::DAY, date: '2026-09-10'))
            ->create(['title' => 'Chequeo anual', 'category' => 'health']);
        RelationshipEvent::factory()->forRelationship($other)
            ->on(EventDate::fromInput(EventDate::DAY, date: '2026-09-11'))
            ->create(['title' => 'Cumpleaños de la hija', 'category' => 'family']);
        RelationshipEvent::factory()->forRelationship($this->relationship)
            ->on(EventDate::fromInput(EventDate::DAY, date: '2025-01-05'))
            ->create(['title' => 'Concierto pasado', 'category' => 'celebration']);

        Livewire::test(RelationshipEvents::class)
            ->set('categoryFilter', 'health')
            ->assertSee('Chequeo anual')
            ->assertDontSee('Cumpleaños de la hija');

        Livewire::test(RelationshipEvents::class)
            ->set('relationFilter', $other->id)
            ->assertSee('Cumpleaños de la hija')
            ->assertDontSee('Chequeo anual');

        Livewire::test(RelationshipEvents::class)
            ->set('periodFilter', 'past')
            ->assertSee('Concierto pasado')
            ->assertDontSee('Chequeo anual');

        $this->get('/relationships/events?category=health&period=upcoming')
            ->assertOk()
            ->assertSee('Chequeo anual')
            ->assertDontSee('Cumpleaños de la hija');
    }

    public function test_a_user_cannot_touch_another_users_event(): void
    {
        $other = User::factory()->create();
        $foreignRelationship = Relationship::factory()->create(['user_id' => $other->id]);
        $foreignEvent = RelationshipEvent::factory()->forRelationship($foreignRelationship)->create(['title' => 'Ajeno']);

        Livewire::test(RelationshipEvents::class)->assertDontSee('Ajeno');

        try {
            Livewire::test(RelationshipShow::class, ['relationship' => $this->relationship->id])
                ->call('deleteEvent', $foreignEvent->id);
            $this->fail('Deleting another user\'s event must be rejected.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            // Expected: the event is not reachable from this owner's relationship.
        }

        $this->assertDatabaseHas('relationship_events', ['id' => $foreignEvent->id]);
    }
}
