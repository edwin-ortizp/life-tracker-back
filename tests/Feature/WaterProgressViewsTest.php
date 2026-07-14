<?php

namespace Tests\Feature;

use App\Livewire\Water\WaterCalendar;
use App\Livewire\Water\WaterRange;
use App\Livewire\Water\WaterSettings;
use App\Livewire\Water\WaterWeekly;
use App\Models\DrinkLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class WaterProgressViewsTest extends TestCase
{
    use RefreshDatabase;

    public function test_calendar_week_and_range_summarize_only_the_authenticated_user(): void
    {
        $user = User::factory()->create(['daily_water_goal' => 2000]);
        $other = User::factory()->create(['daily_water_goal' => 2000]);
        $this->actingAs($user);
        $this->log($user, '2026-07-06', 2000);
        $this->log($user, '2026-07-07', 1000);
        $this->log($other, '2026-07-06', 9000);

        Livewire::withQueryParams(['date' => '2026-07-06'])->test(WaterCalendar::class)->assertSee('1')->assertSee('días con meta alcanzada');
        Livewire::withQueryParams(['date' => '2026-07-06'])->test(WaterWeekly::class)->assertSee('3,000 ml')->assertSee('1/7 días');
        Livewire::withQueryParams(['date' => '2026-07-07', 'period' => 30])->test(WaterRange::class)->assertSee('2/30')->assertSee('2,000');
    }

    public function test_module_settings_updates_the_existing_user_goal_source(): void
    {
        $user = User::factory()->create(['daily_water_goal' => null]);
        $this->actingAs($user);

        Livewire::test(WaterSettings::class)->set('dailyWaterGoal', 2850)->call('saveGoal')->assertSee('Meta diaria actualizada.');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'daily_water_goal' => 2850]);
    }

    private function log(User $user, string $date, int $hydration): void
    {
        $log = new DrinkLog(['date' => $date, 'drink_type' => 'Agua', 'amount' => $hydration, 'hydration_value' => $hydration, 'time' => '08:00', 'timestamp' => strtotime($date.' 08:00')]);
        $log->user_id = $user->id;
        $log->save();
    }
}
