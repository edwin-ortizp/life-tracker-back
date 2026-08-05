<?php

namespace Tests\Feature;

use App\Models\Circle;
use App\Models\Relationship;
use App\Models\RelationshipContactMethod;
use App\Models\RelationshipEvent;
use App\Models\RelationshipTag;
use App\Models\User;
use App\Support\EventDate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class RelationshipDomainTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-08-04 09:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_marking_a_contact_method_primary_demotes_the_previous_one_of_its_type(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $relationship = Relationship::factory()->create(['user_id' => $user->id]);

        $first = RelationshipContactMethod::factory()->forRelationship($relationship)->primary()->create();
        $email = RelationshipContactMethod::factory()->forRelationship($relationship)->primary()
            ->create(['type' => 'email', 'value' => 'alison@example.test']);
        $second = RelationshipContactMethod::factory()->forRelationship($relationship)->primary()->create();

        $this->assertFalse($first->fresh()->is_primary);
        $this->assertTrue($second->fresh()->is_primary);
        $this->assertTrue($email->fresh()->is_primary, 'A different type keeps its own primary.');
    }

    public function test_contact_values_are_normalized_for_search(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $relationship = Relationship::factory()->create(['user_id' => $user->id]);
        $method = RelationshipContactMethod::factory()->forRelationship($relationship)
            ->create(['value' => '+57 (300) 123-4567']);

        $this->assertSame('+573001234567', $method->fresh()->value_normalized);
    }

    public function test_events_keep_the_precision_the_user_declared(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $relationship = Relationship::factory()->create(['user_id' => $user->id]);

        $monthly = RelationshipEvent::factory()->forRelationship($relationship)
            ->on(EventDate::fromInput(EventDate::MONTH, year: 2026, month: 11))
            ->create(['title' => 'Graduación']);

        $this->assertSame('noviembre de 2026', $monthly->fresh()->dateLabel());
        $this->assertSame('2026-11-01', $monthly->fresh()->starts_on->toDateString());
        $this->assertSame('2026-11-30', $monthly->fresh()->ends_on->toDateString());
    }

    public function test_global_visibility_scope_hides_sensitive_events_by_default(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $relationship = Relationship::factory()->create(['user_id' => $user->id]);
        RelationshipEvent::factory()->forRelationship($relationship)->create(['title' => 'Cena']);
        RelationshipEvent::factory()->forRelationship($relationship)->sensitive()->create(['title' => 'Cita médica']);

        $this->assertSame(['Cena'], RelationshipEvent::visibleGlobally()->pluck('title')->all());
        $this->assertCount(2, RelationshipEvent::visibleGlobally(true)->get());
        $this->assertCount(2, $relationship->relationshipEvents()->get());
    }

    public function test_upcoming_and_past_scopes_split_on_the_end_of_the_window(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $relationship = Relationship::factory()->create(['user_id' => $user->id]);
        RelationshipEvent::factory()->forRelationship($relationship)
            ->on(EventDate::fromInput(EventDate::RANGE, startsOn: '2026-08-01', endsOn: '2026-08-10'))
            ->create(['title' => 'Viaje en curso']);
        RelationshipEvent::factory()->forRelationship($relationship)
            ->on(EventDate::fromInput(EventDate::DAY, date: '2026-07-01'))
            ->create(['title' => 'Café']);

        $this->assertSame(['Viaje en curso'], RelationshipEvent::upcoming()->pluck('title')->all());
        $this->assertSame(['Café'], RelationshipEvent::past()->pluck('title')->all());
    }

    public function test_follow_up_uses_the_relationship_frequency_before_the_circle_one(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $circle = Circle::factory()->create(['user_id' => $user->id, 'contact_frequency_days' => 30]);

        $ownCadence = Relationship::factory()->create([
            'user_id' => $user->id,
            'circle_id' => $circle->id,
            'contact_frequency_days' => 7,
            'last_contact_at' => Carbon::parse('2026-07-25'),
        ]);
        $circleCadence = Relationship::factory()->create([
            'user_id' => $user->id,
            'circle_id' => $circle->id,
            'last_contact_at' => Carbon::parse('2026-07-25'),
        ]);
        $noCadence = Relationship::factory()->create([
            'user_id' => $user->id,
            'last_contact_at' => Carbon::parse('2020-01-01'),
        ]);

        $this->assertSame(7, $ownCadence->effectiveContactFrequencyDays());
        $this->assertTrue($ownCadence->isFollowUpDue());

        $this->assertSame(30, $circleCadence->effectiveContactFrequencyDays());
        $this->assertFalse($circleCadence->isFollowUpDue());

        $this->assertNull($noCadence->effectiveContactFrequencyDays());
        $this->assertFalse($noCadence->isFollowUpDue(), 'Without a cadence there is nothing to be overdue against.');
    }

    public function test_a_relationship_exposes_its_birthday_only_when_day_and_month_exist(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $withBirthday = Relationship::factory()->withBirthday(5, 17, 1990)->create(['user_id' => $user->id]);
        $withoutBirthday = Relationship::factory()->create(['user_id' => $user->id]);

        $this->assertSame(37, $withBirthday->birthday()->ageOnNextOccurrence());
        $this->assertNull($withoutBirthday->birthday());
    }

    public function test_tags_are_scoped_to_their_owner_when_synced(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($owner);

        $relationship = Relationship::factory()->create(['user_id' => $owner->id]);
        $ownTag = RelationshipTag::factory()->create(['user_id' => $owner->id, 'name' => 'Universidad']);
        $foreignTag = RelationshipTag::factory()->create(['user_id' => $other->id, 'name' => 'Ajena']);

        $relationship->syncTags([$ownTag->id, $foreignTag->id]);

        $this->assertSame([$ownTag->id], $relationship->tags()->pluck('relationship_tags.id')->all());
        $this->assertDatabaseHas('relationship_tag_assignments', [
            'user_id' => $owner->id,
            'relationship_id' => $relationship->id,
            'relationship_tag_id' => $ownTag->id,
        ]);
    }
}
