<?php

namespace Tests\Feature;

use App\Livewire\Journal\JournalMoodRail;
use App\Models\EnergyEntry;
use App\Models\MoodEntry;
use App\Models\MoodState;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class ModuleExperienceTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_protected_module_route_renders_the_shared_shell(): void
    {
        $user = User::factory()->create();

        foreach ([
            '/', '/water/daily', '/water/calendar', '/water/weekly', '/water/range', '/water/settings',
            '/exercise', '/health', '/health/body', '/vehicles', '/habits', '/habits/weekly', '/mood',
            '/journal', '/journal/life', '/journal/life/week?week=2026-W28', '/pomodoro', '/meals',
            '/tasks/list', '/tasks/gantt', '/tasks/flow', '/tasks/kanban', '/tasks/planning', '/tasks/progress',
            '/relationships', '/goals', '/statistics', '/negative-habits', '/settings',
        ] as $url) {
            $response = $this->actingAs($user)->get($url)
                ->assertOk()
                ->assertSee('md-module-shell', false)
                ->assertDontSee('@entangle(', false);
            $this->assertSame(1, substr_count($response->getContent(), '<h1'), "{$url} should render one module heading.");
        }
    }

    public function test_priority_modules_separate_actions_metrics_and_context(): void
    {
        $user = User::factory()->create();

        $water = $this->actingAs($user)->get('/water/daily')->assertOk();
        $water->assertSee('md-module-header-tools', false)
            ->assertSee('Registrar')
            ->assertDontSee('<a href="'.route('water.settings').'" class="md-btn-outlined">', false);

        $tasks = $this->actingAs($user)->get('/tasks/list')->assertOk();
        $tasks->assertSee('Nueva tarea')
            ->assertSee('Varias tareas')
            ->assertSee('Estado de las tareas')
            ->assertSee("\$wire.entangle('showForm')", false);
        $this->assertSame(1, substr_count($tasks->getContent(), 'md-module-primary-fab'));

        $this->actingAs($user)->get('/habits')
            ->assertOk()
            ->assertSee('habit-month-calendar', false)
            ->assertSee('Mejor racha activa');

        $this->actingAs($user)->get('/health')
            ->assertOk()
            ->assertSee('Próximo cuidado')
            ->assertDontSee('Cuidar también es recordar');
    }

    public function test_water_legacy_route_redirects_and_tabs_keep_the_selected_date(): void
    {
        $user = User::factory()->create();
        $date = '2026-07-10';

        $this->actingAs($user)->get('/water')->assertRedirect('/water/daily');
        $this->actingAs($user)->get("/water/daily?date={$date}")
            ->assertOk()
            ->assertSee(route('water.calendar', ['date' => $date]))
            ->assertSee('aria-current="page"', false);
    }

    public function test_journal_context_can_register_mood_and_energy_for_the_same_date(): void
    {
        $user = User::factory()->create();
        $date = '2026-07-10';

        $this->actingAs($user);
        $state = MoodState::create(['emoji' => '🙂', 'text' => 'Bien', 'value' => 4]);

        Livewire::test(JournalMoodRail::class, ['selectedDate' => $date])
            ->call('saveMood', $state->id)
            ->set('energyLevel', 4)
            ->set('energyComment', 'Concentrado')
            ->call('saveEnergy')
            ->assertSee('Bien')
            ->assertSee('4/5');

        $this->assertTrue(MoodEntry::whereDate('date', $date)->where('user_id', $user->id)->where('text', 'Bien')->exists());
        $this->assertTrue(EnergyEntry::whereDate('date', $date)->where('user_id', $user->id)->where('level', 4)->where('comment', 'Concentrado')->exists());
    }
}
