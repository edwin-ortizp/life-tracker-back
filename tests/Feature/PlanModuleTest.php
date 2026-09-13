<?php

namespace Tests\Feature;

use App\Livewire\Plan\PlanIndex;
use App\Livewire\Plan\PlanShow;
use App\Livewire\Relationship\RelationshipPlans;
use App\Models\Circle;
use App\Models\Plan;
use App\Models\PlanVisit;
use App\Models\Relationship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class PlanModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_plan_routes_render_inside_the_shell(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->for($user)->create(['title' => 'Heladería Popsy']);
        $person = Relationship::factory()->for($user)->create();

        foreach (['/plans', "/plans/{$plan->id}", "/relationships/{$person->id}/plans"] as $url) {
            $response = $this->actingAs($user)->get($url)->assertOk()->assertSee('md-module-shell', false);
            $this->assertSame(1, substr_count($response->getContent(), '<h1'), "{$url} should render one module heading.");
        }
    }

    public function test_user_creates_a_plan_with_circles_people_and_links(): void
    {
        $user = User::factory()->create();
        $circle = Circle::factory()->for($user)->create(['name' => 'Pareja de prueba']);
        $person = Relationship::factory()->for($user)->create();
        $foreignPerson = Relationship::factory()->create();

        $this->actingAs($user);

        Livewire::test(PlanIndex::class)
            ->call('openPlanForm')
            ->set('planTitle', 'Heladería Popsy')
            ->set('planType', 'dessert')
            ->set('planCity', 'Popayán')
            ->set('planCircles', [$circle->id])
            ->set('planPeople', [$person->id, $foreignPerson->id])
            ->set('planLinks', [['url' => 'https://www.instagram.com/popsy', 'label' => ''], ['url' => '', 'label' => '']])
            ->call('savePlan')
            ->assertHasNoErrors()
            ->assertSet('showPlanForm', false);

        $plan = Plan::query()->with(['circles', 'relationships', 'links'])->sole();

        $this->assertSame('pending', $plan->status);
        $this->assertSame([$circle->id], $plan->circles->pluck('id')->all());
        $this->assertSame([$person->id], $plan->relationships->pluck('id')->all());
        $this->assertCount(1, $plan->links);
        $this->assertSame('Instagram', $plan->links->first()->platform()['label']);
    }

    public function test_image_urls_keep_their_order_and_the_first_is_main(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $component = Livewire::test(PlanIndex::class)
            ->call('openPlanForm')
            ->set('planTitle', 'Termales de Coconuco')
            ->set('planImages', ['https://example.com/piscina.jpg', '', 'https://example.com/montana.jpg'])
            ->call('movePlanImageUp', 2)
            ->call('savePlan')
            ->assertHasNoErrors();

        $plan = Plan::query()->with('images')->sole();
        $this->assertSame(['https://example.com/piscina.jpg', 'https://example.com/montana.jpg'], $plan->images->pluck('url')->all());
        $this->assertSame('https://example.com/piscina.jpg', $plan->mainImageUrl());

        $component->call('openPlanForm', $plan->id)
            ->assertSet('planImages', ['https://example.com/piscina.jpg', 'https://example.com/montana.jpg'])
            ->call('movePlanImageUp', 1)
            ->call('savePlan');

        $this->assertSame('https://example.com/montana.jpg', $plan->fresh()->mainImageUrl());
        $this->get('/plans')->assertSee('https://example.com/montana.jpg', false);
    }

    public function test_invalid_image_urls_are_rejected(): void
    {
        $this->actingAs(User::factory()->create());

        Livewire::test(PlanIndex::class)
            ->call('openPlanForm')
            ->set('planTitle', 'Picnic')
            ->set('planImages', ['no-es-una-url'])
            ->call('savePlan')
            ->assertHasErrors(['planImages.0']);

        $this->assertSame(0, Plan::query()->count());
    }

    public function test_a_dated_plan_starts_as_scheduled(): void
    {
        $this->actingAs(User::factory()->create());

        Livewire::test(PlanIndex::class)
            ->call('openPlanForm')
            ->set('planTitle', 'Concierto Morat')
            ->set('planType', 'concert')
            ->set('planScheduledOn', today()->addDays(64)->toDateString())
            ->call('savePlan')
            ->assertHasNoErrors();

        $plan = Plan::query()->sole();
        $this->assertSame('scheduled', $plan->status);
        $this->assertSame(64, $plan->daysUntil());
    }

    public function test_recording_a_visit_with_several_people_updates_counts(): void
    {
        $user = User::factory()->create();
        $ali = Relationship::factory()->for($user)->create();
        $julian = Relationship::factory()->for($user)->create();
        $plan = Plan::factory()->for($user)->create();

        $this->actingAs($user);

        Livewire::test(PlanShow::class, ['plan' => $plan->id])
            ->call('openVisitForm', $plan->id)
            ->set('visitDate', today()->subMonths(3)->toDateString())
            ->set('visitPeople', [$ali->id, $julian->id])
            ->set('visitComment', 'Probamos el de maracuyá.')
            ->call('saveVisit')
            ->assertHasNoErrors()
            ->call('openVisitForm', $plan->id)
            ->set('visitDate', today()->subMonth()->toDateString())
            ->set('visitPeople', [$ali->id])
            ->call('saveVisit')
            ->assertHasNoErrors();

        $global = Plan::query()->withVisitStats()->find($plan->id);
        $this->assertSame(2, (int) $global->visits_count);
        $this->assertStringStartsWith(today()->subMonth()->toDateString(), (string) $global->last_visited_on);

        $withJulian = Plan::query()->withVisitStats($julian->id)->find($plan->id);
        $this->assertSame(1, (int) $withJulian->visits_count);
        $this->assertStringStartsWith(today()->subMonths(3)->toDateString(), (string) $withJulian->last_visited_on);

        $this->assertEqualsCanonicalizing([$ali->id, $julian->id], $plan->relationships()->pluck('relationships.id')->all());
    }

    public function test_a_visit_needs_at_least_one_person_and_a_past_date(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->for($user)->create();

        $this->actingAs($user);

        Livewire::test(PlanShow::class, ['plan' => $plan->id])
            ->call('openVisitForm', $plan->id)
            ->set('visitDate', today()->addDay()->toDateString())
            ->set('visitPeople', [])
            ->call('saveVisit')
            ->assertHasErrors(['visitDate', 'visitPeople']);

        $this->assertSame(0, PlanVisit::query()->count());
    }

    public function test_a_scheduled_plan_is_done_after_its_visit(): void
    {
        $user = User::factory()->create();
        $person = Relationship::factory()->for($user)->create();
        $plan = Plan::factory()->for($user)->scheduled(today()->toDateString())->create();

        $this->actingAs($user);

        Livewire::test(PlanShow::class, ['plan' => $plan->id])
            ->call('openVisitForm', $plan->id)
            ->set('visitPeople', [$person->id])
            ->call('saveVisit')
            ->assertHasNoErrors();

        $this->assertSame('done', $plan->fresh()->status);
    }

    public function test_plans_are_isolated_per_user(): void
    {
        $user = User::factory()->create();
        $other = Plan::factory()->create(['title' => 'Plan ajeno secreto']);

        $this->actingAs($user)->get('/plans')->assertOk()->assertDontSee('Plan ajeno secreto');
        $this->actingAs($user)->get("/plans/{$other->id}")->assertNotFound();
    }

    public function test_surprise_only_picks_own_open_plans(): void
    {
        $user = User::factory()->create();
        $pending = Plan::factory()->for($user)->create();
        Plan::factory()->for($user)->create(['status' => 'done']);
        Plan::factory()->create();

        $this->actingAs($user);

        Livewire::test(PlanIndex::class)
            ->call('surprise')
            ->assertRedirect(route('plans.show', $pending));
    }

    public function test_surprise_explains_when_nothing_matches(): void
    {
        $user = User::factory()->create();
        Plan::factory()->for($user)->create(['type' => 'trip']);

        $this->actingAs($user);

        Livewire::test(PlanIndex::class)
            ->call('setGroup', 'events')
            ->call('surprise')
            ->assertNoRedirect()
            ->assertSet('surpriseMessage', 'No hay planes pendientes con estos filtros.');
    }

    public function test_group_and_people_filters_narrow_the_list(): void
    {
        $user = User::factory()->create();
        $person = Relationship::factory()->for($user)->create();
        $trip = Plan::factory()->for($user)->create(['title' => 'Cartagena', 'type' => 'trip']);
        Plan::factory()->for($user)->create(['title' => 'La Cosecha', 'type' => 'restaurant']);
        $trip->relationships()->attach($person->id);

        $this->actingAs($user);

        Livewire::test(PlanIndex::class)
            ->call('setGroup', 'trips')
            ->assertSee('Cartagena')
            ->assertDontSee('La Cosecha')
            ->call('setGroup', '')
            ->set('people', [$person->id])
            ->assertSee('Cartagena')
            ->assertDontSee('La Cosecha');
    }

    public function test_relationship_tab_lists_plans_of_the_person_and_their_circle(): void
    {
        $user = User::factory()->create();
        $circle = Circle::factory()->for($user)->create();
        $person = Relationship::factory()->for($user)->create(['circle_id' => $circle->id]);

        Plan::factory()->for($user)->create(['title' => 'Plan directo'])->relationships()->attach($person->id);
        Plan::factory()->for($user)->create(['title' => 'Plan del círculo'])->circles()->attach($circle->id);
        Plan::factory()->for($user)->create(['title' => 'Plan de otra persona']);

        $this->actingAs($user);

        Livewire::test(RelationshipPlans::class, ['relationship' => $person->id])
            ->assertSee('Plan directo')
            ->assertSee('Plan del círculo')
            ->assertDontSee('Plan de otra persona')
            ->call('openPlanForm')
            ->assertSet('planPeople', [$person->id]);
    }
}
