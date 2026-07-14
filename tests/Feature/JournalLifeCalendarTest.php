<?php

namespace Tests\Feature;

use App\Livewire\Journal\JournalLifeCalendar;
use App\Livewire\Journal\JournalLifeWeek;
use App\Models\JournalEntry;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class JournalLifeCalendarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-07-12 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_life_calendar_requires_birth_date_and_life_expectancy(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user);

        Livewire::test(JournalLifeCalendar::class)
            ->assertSee('Tu calendario todavía no tiene límites')
            ->assertSee(route('settings'));
    }

    public function test_life_calendar_uses_exact_birth_and_expectancy_week_boundaries(): void
    {
        $user = User::factory()->create([
            'birth_date' => '2000-06-15',
            'life_expectancy_years' => 80,
        ]);
        $this->actingAs($user);

        Livewire::test(JournalLifeCalendar::class)
            ->assertSee('2000-W24')
            ->assertSee('2080-W24')
            ->assertDontSee('2000-W23')
            ->assertDontSee('2080-W25');
    }

    public function test_life_calendar_groups_entry_counts_into_the_four_visual_levels(): void
    {
        $user = User::factory()->create([
            'birth_date' => '2026-05-01',
            'life_expectancy_years' => 2,
        ]);
        $this->actingAs($user);

        foreach (range(0, 2) as $day) {
            JournalEntry::create(['date' => Carbon::parse('2026-06-15')->addDays($day)->toDateString(), 'text' => 'Tres días']);
        }
        foreach (range(0, 4) as $day) {
            JournalEntry::create(['date' => Carbon::parse('2026-06-22')->addDays($day)->toDateString(), 'text' => 'Cinco días']);
        }
        foreach (range(0, 6) as $day) {
            JournalEntry::create(['date' => Carbon::parse('2026-06-29')->addDays($day)->toDateString(), 'text' => 'Siete días']);
        }

        Livewire::test(JournalLifeCalendar::class)
            ->assertSeeHtml('life-calendar-cell level-0')
            ->assertSeeHtml('life-calendar-cell level-1')
            ->assertSeeHtml('life-calendar-cell level-2')
            ->assertSeeHtml('life-calendar-cell level-3')
            ->assertSeeHtml('life-calendar-cell level-0 is-current')
            ->assertSeeHtml('life-calendar-cell level-0 is-future');
    }

    public function test_life_calendar_renders_the_complete_life_map_and_links_each_available_week(): void
    {
        $user = User::factory()->create([
            'birth_date' => '2020-01-01',
            'life_expectancy_years' => 90,
        ]);
        $this->actingAs($user);

        Livewire::test(JournalLifeCalendar::class)
            ->assertSee('MAPA COMPLETO')
            ->assertSee('2020')
            ->assertSee('2109')
            ->assertSee(route('journal.life.week', ['week' => '2024-W01']));
    }

    public function test_week_opens_its_own_view_with_day_links_to_the_journal(): void
    {
        $user = User::factory()->create([
            'birth_date' => '2020-01-01',
            'life_expectancy_years' => 90,
        ]);
        $this->actingAs($user);
        JournalEntry::create(['date' => '2026-07-07', 'text' => 'Martes memorable']);

        Livewire::withQueryParams(['week' => '2026-W28'])
            ->test(JournalLifeWeek::class)
            ->assertSet('week', '2026-W28')
            ->assertSee('2026-W28')
            ->assertSee('Entradas')
            ->assertSee('Vida')
            ->assertSee('Semana')
            ->assertSee('Martes memorable')
            ->assertSee(route('journal', ['date' => '2026-07-06']))
            ->assertSee(route('journal', ['date' => '2026-07-12']));
    }

    public function test_life_calendar_has_a_canonical_route_and_journal_tabs(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/journal/life')
            ->assertOk()
            ->assertSee('Vistas del módulo')
            ->assertSee('Entradas')
            ->assertSee('Semana');

        $this->actingAs($user)->get('/journal/life/week?week=2026-W28')
            ->assertOk()
            ->assertSee('2026-W28');

        $this->actingAs($user)->get('/journal')
            ->assertOk()
            ->assertSee('Vida')
            ->assertSee('Semana');
    }
}
