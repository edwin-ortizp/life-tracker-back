<?php

namespace Tests\Feature;

use App\Livewire\Settings\SettingsPage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Livewire\Livewire;
use Tests\TestCase;

class SettingsPanelTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_section_renders_and_unknown_ones_are_not_found(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('settings'))->assertOk()->assertSee('Perfil público');
        foreach (['body', 'security', 'oauth', 'integrations', 'mcp', 'about'] as $section) {
            $this->get(route('settings.section', $section))->assertOk();
        }
        $this->get('/settings/nope')->assertNotFound();
    }

    public function test_mcp_section_lists_and_filters_the_server_tools(): void
    {
        $this->actingAs(User::factory()->create());

        $component = Livewire::test(SettingsPage::class, ['section' => 'mcp']);
        $total = $component->viewData('toolTotal');

        $this->assertGreaterThan(50, $total);
        $this->assertCount($total, $component->viewData('tools'));
        $component->assertSee('create-task-tool');

        $component->set('toolModule', 'Meal');
        $this->assertTrue($component->viewData('tools')->every(fn ($tool) => $tool['module'] === 'Meal'));

        $component->set('toolModule', '')->set('toolKind', 'read');
        $this->assertTrue($component->viewData('tools')->every(fn ($tool) => $tool['readOnly']));

        $component->call('clearToolFilters')->set('toolSearch', 'cumpleaños');
        $this->assertContains('list-upcoming-birthdays-tool', $component->viewData('tools')->pluck('name'));
    }

    public function test_tool_detail_shows_the_full_description_and_parameters(): void
    {
        $this->actingAs(User::factory()->create());

        Livewire::test(SettingsPage::class, ['section' => 'mcp'])
            ->call('showTool', 'create-task-tool')
            ->assertSet('toolOpen', true)
            ->assertSee('Parámetros')
            ->assertSee('Título de la tarea.')
            ->call('closeTool')
            ->assertSet('toolOpen', false);
    }

    public function test_closing_another_session_deletes_only_that_users_row(): void
    {
        config(['session.driver' => 'database']);
        $user = User::factory()->create();
        $other = User::factory()->create();
        DB::table('sessions')->insert([
            ['id' => 'phone', 'user_id' => $user->id, 'ip_address' => '10.0.0.2', 'user_agent' => 'Safari iPhone', 'payload' => '', 'last_activity' => now()->timestamp],
            ['id' => 'foreign', 'user_id' => $other->id, 'ip_address' => '10.0.0.3', 'user_agent' => 'Chrome', 'payload' => '', 'last_activity' => now()->timestamp],
        ]);
        $this->actingAs($user);

        Livewire::test(SettingsPage::class, ['section' => 'security'])
            ->assertSee('Safari en iPhone')
            ->call('closeSession', 'phone')
            ->call('closeSession', 'foreign');

        $this->assertDatabaseMissing('sessions', ['id' => 'phone']);
        $this->assertDatabaseHas('sessions', ['id' => 'foreign']);
    }
}
