<?php

namespace Tests\Feature;

use App\Livewire\Exercise\ExerciseDaily;
use App\Livewire\Water\WaterDaily;
use App\Models\DrinkLog;
use App\Models\DrinkType;
use App\Models\ExerciseLog;
use App\Models\ExerciseType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class DailyLogDefaultDateFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_water_log_table_starts_filtered_by_today_and_can_show_every_record(): void
    {
        $this->actingAs(User::factory()->create());
        $water = DrinkType::create(['name' => 'Agua', 'icon' => '💧', 'hydration_factor' => 1]);
        $this->drink($water, now()->toDateString(), 250);
        $this->drink($water, now()->subDay()->toDateString(), 400);

        $dayMetrics = null;

        Livewire::test(WaterDaily::class)
            ->assertSet('dateScope', 'day')
            ->assertSee('Fecha: Hoy')
            ->assertSee('Limpiar filtros')
            ->assertViewHas('logs', fn ($logs) => $logs->total() === 1)
            ->assertViewHas('totalHydration', function ($total) use (&$dayMetrics) {
                $dayMetrics = $total;

                return true;
            })
            ->call('removeFilter', 'date')
            ->assertSet('dateScope', 'all')
            ->assertDontSee('Fecha: Hoy')
            ->assertViewHas('logs', fn ($logs) => $logs->total() === 2)
            // Las métricas del día no dependen del filtro de la tabla.
            ->assertViewHas('totalHydration', fn ($total) => $total == $dayMetrics)
            ->call('applyFilters', 'day', '')
            ->assertViewHas('logs', fn ($logs) => $logs->total() === 1)
            ->call('clearFilters')
            ->assertViewHas('logs', fn ($logs) => $logs->total() === 2);
    }

    public function test_exercise_log_table_starts_filtered_by_today_and_keeps_dates_when_editing_other_days(): void
    {
        $this->actingAs(User::factory()->create());
        $run = ExerciseType::create(['name' => 'Correr', 'calories_per_hour' => 700, 'icon' => '🏃']);
        $walk = ExerciseType::create(['name' => 'Caminar', 'calories_per_hour' => 250, 'icon' => '🚶']);
        ExerciseLog::create(['date' => now()->toDateString(), 'exercise_type_id' => $run->id, 'duration' => 30]);
        $old = ExerciseLog::create(['date' => now()->subDays(3)->toDateString(), 'exercise_type_id' => $walk->id, 'duration' => 45]);

        $dayDuration = null;

        Livewire::test(ExerciseDaily::class)
            ->assertSee('Fecha: Hoy')
            ->assertViewHas('logs', fn ($logs) => $logs->total() === 1)
            ->assertViewHas('totalDuration', function ($total) use (&$dayDuration) {
                $dayDuration = $total;

                return true;
            })
            ->call('applyFilters', 'all', $walk->id)
            ->assertSee('Tipo: Caminar')
            ->assertViewHas('logs', fn ($logs) => $logs->total() === 1 && $logs->first()->is($old))
            ->call('removeFilter', 'type')
            ->assertViewHas('logs', fn ($logs) => $logs->total() === 2)
            ->assertViewHas('totalDuration', fn ($total) => $total == $dayDuration)
            ->call('openForm', $old->id)
            ->set('duration', 50)
            ->call('save');

        $this->assertSame(now()->subDays(3)->toDateString(), $old->fresh()->date->toDateString());
        $this->assertSame(50, $old->fresh()->duration);
    }

    private function drink(DrinkType $type, string $date, int $amount): void
    {
        DrinkLog::create([
            'date' => $date,
            'drink_type' => $type->name,
            'amount' => $amount,
            'hydration_value' => $amount,
            'time' => '08:00',
            'timestamp' => strtotime($date.' 08:00'),
            'drink_type_id' => $type->id,
        ]);
    }
}
