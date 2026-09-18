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

    public function test_water_log_table_sorts_by_time_by_default_and_by_amount(): void
    {
        $this->actingAs(User::factory()->create());
        $water = DrinkType::create(['name' => 'Agua', 'icon' => '💧', 'hydration_factor' => 1]);
        $today = now()->toDateString();
        $this->drink($water, $today, 500, '08:00');
        $this->drink($water, $today, 200, '15:00');
        $this->drink($water, $today, 300, '11:00');

        $amounts = fn (array $expected) => fn ($logs) => $logs->pluck('amount')->all() === $expected;

        Livewire::test(WaterDaily::class)
            ->assertSet('sort', 'recent')
            ->assertSee('Más reciente')
            ->assertViewHas('logs', $amounts([200, 300, 500]))
            ->set('sort', 'oldest')
            ->assertViewHas('logs', $amounts([500, 300, 200]))
            ->set('sort', 'amount')
            ->assertViewHas('logs', $amounts([500, 300, 200]))
            ->set('sort', 'nope')
            ->assertSet('sort', 'recent');
    }

    public function test_exercise_log_table_sorts_by_recent_by_default_and_by_duration(): void
    {
        $this->actingAs(User::factory()->create());
        $run = ExerciseType::create(['name' => 'Correr', 'calories_per_hour' => 700, 'icon' => '🏃']);
        ExerciseLog::create(['date' => now()->toDateString(), 'exercise_type_id' => $run->id, 'duration' => 20])->forceFill(['created_at' => now()->subHours(3)])->save();
        ExerciseLog::create(['date' => now()->toDateString(), 'exercise_type_id' => $run->id, 'duration' => 60])->forceFill(['created_at' => now()->subHours(2)])->save();
        ExerciseLog::create(['date' => now()->toDateString(), 'exercise_type_id' => $run->id, 'duration' => 40])->forceFill(['created_at' => now()->subHour()])->save();

        $durations = fn (array $expected) => fn ($logs) => $logs->pluck('duration')->all() === $expected;

        Livewire::test(ExerciseDaily::class)
            ->assertViewHas('logs', $durations([40, 60, 20]))
            ->set('sort', 'oldest')
            ->assertViewHas('logs', $durations([20, 60, 40]))
            ->set('sort', 'duration')
            ->assertViewHas('logs', $durations([60, 40, 20]));
    }

    private function drink(DrinkType $type, string $date, int $amount, string $time = '08:00'): void
    {
        DrinkLog::create([
            'date' => $date,
            'drink_type' => $type->name,
            'amount' => $amount,
            'hydration_value' => $amount,
            'time' => $time,
            'timestamp' => strtotime($date.' '.$time),
            'drink_type_id' => $type->id,
        ]);
    }
}
