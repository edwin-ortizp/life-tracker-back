<?php

namespace Tests\Feature;

use App\Livewire\Water\WaterDaily;
use App\Models\DrinkLog;
use App\Models\DrinkType;
use App\Models\User;
use App\Support\WaterProgress;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class WaterDailyProgressTest extends TestCase
{
    use RefreshDatabase;

    public function test_progress_lives_in_the_rail_instead_of_top_metrics(): void
    {
        $this->actingAs(User::factory()->create(['daily_water_goal' => 2200]));
        DrinkType::create(['name' => 'Agua', 'icon' => '💧', 'hydration_factor' => 1]);
        $this->drink(now()->toDateString(), 1500);

        // El panel contextual solo es visible si el módulo lo declara (config/modules.php → 'rail').
        $this->get('/water/daily')->assertOk()->assertSee('md-module-workspace--rail', false);

        Livewire::test(WaterDaily::class)
            ->assertDontSee('Progreso del día')
            ->assertDontSee('Ritmo mensual')
            ->assertSee('Objetivo de hoy')
            ->assertSee('1,5 L / 2,2 L')
            ->assertSee('68 %')
            ->assertSee('Faltan 700 ml para alcanzar tu meta diaria.')
            ->assertSee('Calendario del mes')
            ->assertSee('Agregar rápido');
    }

    public function test_goal_card_supports_values_over_one_hundred_percent(): void
    {
        $this->actingAs(User::factory()->create(['daily_water_goal' => 2200]));
        $this->drink(now()->toDateString(), 2500);

        Livewire::test(WaterDaily::class)
            ->assertViewHas('rawPercentage', 114)
            ->assertSee('2,5 L / 2,2 L')
            ->assertSee('114 %')
            ->assertSee('Superaste tu meta por 300 ml.');
    }

    public function test_streak_counts_only_consecutive_days_at_one_hundred_percent(): void
    {
        $this->actingAs(User::factory()->create(['daily_water_goal' => 2000]));
        $this->drink(now()->subDays(3)->toDateString(), 1000);
        $this->drink(now()->subDays(2)->toDateString(), 2100);
        $this->drink(now()->subDay()->toDateString(), 2000);
        $this->drink(now()->toDateString(), 500);

        // Hoy aún parcial no rompe la racha; el día parcial de hace tres días sí la corta.
        Livewire::test(WaterDaily::class)
            ->assertViewHas('streak', 2)
            ->assertSee('Racha actual: 2 días cumpliendo la meta al 100%.');

        $this->drink(now()->toDateString(), 1500);

        $this->assertSame(3, WaterProgress::streak(2000));
    }

    public function test_calendar_navigates_months_and_marks_days_without_data(): void
    {
        $this->actingAs(User::factory()->create(['daily_water_goal' => 2000]));
        $this->drink('2026-09-10', 2100);

        Livewire::test(WaterDaily::class, ['date' => '2026-09-14'])
            ->assertSet('calendarMonth', '2026-09')
            ->call('previousMonth')
            ->assertSet('calendarMonth', '2026-08')
            ->assertViewHas('monthData', fn ($month) => $month['weeks']->flatten(1)->firstWhere('in_month', true)['date']->month === 8)
            ->call('nextMonth')
            ->call('nextMonth')
            ->assertSet('calendarMonth', '2026-10');

        $days = WaterProgress::month(Carbon::parse('2026-09-14'), 2000)['weeks']->flatten(1)->keyBy(fn ($day) => $day['date']->toDateString());

        $this->assertTrue($days['2026-09-10']['has_data']);
        $this->assertSame(105, $days['2026-09-10']['raw_percentage']);
        $this->assertFalse($days['2026-09-11']['has_data']);
    }

    private function drink(string $date, int $amount): void
    {
        DrinkLog::create([
            'date' => $date,
            'drink_type' => 'Agua',
            'amount' => $amount,
            'hydration_value' => $amount,
            'time' => '08:00',
            'timestamp' => strtotime($date.' 08:00'),
        ]);
    }
}
