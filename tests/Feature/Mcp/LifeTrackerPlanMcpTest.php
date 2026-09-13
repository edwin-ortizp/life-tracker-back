<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Plan\CreatePlanTool;
use App\Mcp\Tools\Plan\ListPlansTool;
use App\Mcp\Tools\Plan\UpdatePlanTool;
use App\Mcp\Tools\Relationship\CreateContactTool;
use App\Mcp\Tools\Relationship\ListCirclesTool;
use App\Models\Circle;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LifeTrackerPlanMcpTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_circles_returns_only_the_users_circles(): void
    {
        $user = User::factory()->create();
        Circle::factory()->for(User::factory()->create())->create(['name' => 'Círculo ajeno']);

        LifeTrackerServer::actingAs($user)
            ->tool(ListCirclesTool::class, [])
            ->assertOk()
            ->assertSee('Familia muy cercana')
            ->assertSee('Amigos de trabajo')
            ->assertDontSee('Círculo ajeno');
    }

    public function test_create_plan_resolves_exact_circle_names_despite_similar_ones(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(CreatePlanTool::class, [
                'title' => 'Heladería Popsy',
                'type' => 'dessert',
                'city' => 'Popayán',
                'circle_names' => ['Familia', 'Amigos'],
                'links' => ['https://www.instagram.com/popsy'],
            ])
            ->assertOk()
            ->assertSee('Plan creado')
            ->assertSee('Heladería Popsy');

        $plan = Plan::withoutGlobalScopes()->where('user_id', $user->id)->with(['circles', 'links'])->sole();

        $this->assertEqualsCanonicalizing(['Familia', 'Amigos'], $plan->circles->pluck('name')->all());
        $this->assertSame('pending', $plan->status);
        $this->assertCount(1, $plan->links);
    }

    public function test_create_plan_links_contacts_and_schedules_dated_plans(): void
    {
        $user = User::factory()->create();
        $user->relationships()->create(['full_name' => 'Alison Pino', 'category' => 'pareja']);

        LifeTrackerServer::actingAs($user)
            ->tool(CreatePlanTool::class, [
                'title' => 'Concierto Morat',
                'type' => 'concert',
                'scheduled_on' => today()->addDays(60)->toDateString(),
                'contact_names' => ['Alison'],
            ])
            ->assertOk()
            ->assertSee('Alison Pino');

        $plan = Plan::withoutGlobalScopes()->where('user_id', $user->id)->with('relationships')->sole();
        $this->assertSame('scheduled', $plan->status);
        $this->assertSame(['Alison Pino'], $plan->relationships->pluck('full_name')->all());
    }

    public function test_plan_images_by_url_can_be_added_and_the_main_one_changed(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(CreatePlanTool::class, [
                'title' => 'Cartagena en pareja',
                'type' => 'trip',
                'image_urls' => ['https://example.com/playa.jpg'],
            ])
            ->assertOk();

        LifeTrackerServer::actingAs($user)
            ->tool(UpdatePlanTool::class, [
                'title' => 'Cartagena en pareja',
                'add_image_urls' => ['https://example.com/murallas.jpg'],
                'main_image_url' => 'https://example.com/murallas.jpg',
            ])
            ->assertOk();

        $plan = Plan::withoutGlobalScopes()->where('user_id', $user->id)->with('images')->sole();
        $this->assertSame(['https://example.com/murallas.jpg', 'https://example.com/playa.jpg'], $plan->images->pluck('url')->all());

        LifeTrackerServer::actingAs($user)
            ->tool(ListPlansTool::class, [])
            ->assertSee('murallas.jpg');
    }

    public function test_create_plan_rejects_unknown_circles_without_creating(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(CreatePlanTool::class, ['title' => 'Picnic', 'circle_names' => ['Vecinos del barrio']])
            ->assertHasErrors()
            ->assertSee('Vecinos del barrio');

        $this->assertSame(0, Plan::withoutGlobalScopes()->count());
    }

    public function test_create_plan_does_not_duplicate_an_existing_plan(): void
    {
        $user = User::factory()->create();
        Plan::factory()->for($user)->create(['title' => 'Museo Nacional', 'city' => 'Bogotá']);

        LifeTrackerServer::actingAs($user)
            ->tool(CreatePlanTool::class, ['title' => 'museo nacional', 'city' => 'Bogotá'])
            ->assertHasErrors()
            ->assertSee('update-plan-tool');

        $this->assertSame(1, Plan::withoutGlobalScopes()->count());
    }

    public function test_update_plan_adds_and_removes_circles(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->for($user)->create(['title' => 'Termales de Coconuco']);
        $plan->circles()->attach(Circle::withoutGlobalScopes()->where('user_id', $user->id)->where('name', 'Familia')->value('id'));

        LifeTrackerServer::actingAs($user)
            ->tool(UpdatePlanTool::class, [
                'title' => 'Termales',
                'add_circle_names' => ['Pareja'],
                'remove_circle_names' => ['Familia'],
            ])
            ->assertOk()
            ->assertSee('Pareja');

        $this->assertSame(['Pareja'], $plan->circles()->withoutGlobalScopes()->pluck('name')->all());
    }

    public function test_list_plans_filters_by_circle(): void
    {
        $user = User::factory()->create();
        $pareja = Circle::withoutGlobalScopes()->where('user_id', $user->id)->where('name', 'Pareja')->value('id');
        Plan::factory()->for($user)->create(['title' => 'Cena romántica'])->circles()->attach($pareja);
        Plan::factory()->for($user)->create(['title' => 'Asado de trabajo']);
        Plan::factory()->create(['title' => 'Plan ajeno']);

        LifeTrackerServer::actingAs($user)
            ->tool(ListPlansTool::class, ['circle_name' => 'Pareja'])
            ->assertOk()
            ->assertSee('Cena romántica')
            ->assertDontSee('Asado de trabajo')
            ->assertDontSee('Plan ajeno');
    }

    public function test_contact_tools_resolve_an_exact_default_circle_name(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(CreateContactTool::class, ['full_name' => 'Julián Ortiz', 'circle_name' => 'Familia'])
            ->assertOk();

        $this->assertSame('Familia', $user->relationships()->sole()->circle()->withoutGlobalScopes()->value('name'));
    }
}
