<?php

namespace Tests\Feature;

use App\Livewire\Pomodoro\PomodoroTimer;
use App\Models\ModuleSetting;
use App\Models\PomodoroSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class PomodoroTimerTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_manual_session_uses_selected_date_and_updates_progress(): void
    {
        Carbon::setTestNow('2026-07-13 10:00:00');
        $user = User::factory()->create();

        Livewire::actingAs($user)
            ->test(PomodoroTimer::class)
            ->set('selectedDate', '2026-07-13')
            ->set('manualHours', 1)
            ->set('manualMinutes', 30)
            ->set('manualDescription', 'Preparar entrega')
            ->call('saveManualSession')
            ->assertSee('90 min')
            ->assertSee('30%');

        $session = PomodoroSession::firstOrFail();
        $this->assertSame($user->id, $session->user_id);
        $this->assertSame('2026-07-13', $session->date->toDateString());
        $this->assertSame(5400, $session->duration);
        $this->assertTrue($session->completed);
        $this->assertSame('Preparar entrega', $session->description);
    }

    public function test_weekend_goal_is_used_and_goals_are_saved_per_user(): void
    {
        Carbon::setTestNow('2026-07-13 10:00:00');
        $user = User::factory()->create();
        $this->actingAs($user);
        PomodoroSession::create([
            'date' => '2026-07-12',
            'start_time' => ['timestamp' => Carbon::parse('2026-07-12 08:00')->timestamp],
            'end_time' => ['timestamp' => Carbon::parse('2026-07-12 09:00')->timestamp],
            'duration' => 3600,
            'completed' => true,
        ]);

        Livewire::actingAs($user)
            ->test(PomodoroTimer::class)
            ->set('selectedDate', '2026-07-12')
            ->assertSee('Meta: 120 min')
            ->assertSee('50%')
            ->set('weekdayGoal', 360)
            ->set('weekendGoal', 180)
            ->call('saveGoals');

        $setting = ModuleSetting::where('module', 'pomodoro')->firstOrFail();
        $this->assertSame(360, $setting->settings['weekday_goal_minutes']);
        $this->assertSame(180, $setting->settings['weekend_goal_minutes']);
    }

    public function test_timer_session_is_stored_in_seconds_for_today(): void
    {
        Carbon::setTestNow('2026-07-13 10:00:00');
        $user = User::factory()->create();

        Livewire::actingAs($user)
            ->test(PomodoroTimer::class)
            ->set('selectedDate', '2026-07-10')
            ->call('saveSession', 1500, 'Trabajo concentrado')
            ->assertSet('selectedDate', '2026-07-13');

        $session = PomodoroSession::firstOrFail();
        $this->assertSame($user->id, $session->user_id);
        $this->assertSame('2026-07-13', $session->date->toDateString());
        $this->assertSame(1500, $session->duration);
        $this->assertSame('Trabajo concentrado', $session->description);
    }

    public function test_duration_migration_normalizes_millisecond_timestamps(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $session = PomodoroSession::create([
            'date' => '2025-01-17',
            'start_time' => ['timestamp' => 1737122400000],
            'end_time' => ['timestamp' => 1737124200000],
            'duration' => 30,
            'completed' => true,
        ]);

        $migration = require database_path('migrations/2026_07_13_000001_normalize_pomodoro_session_durations_to_seconds.php');
        $migration->up();

        $this->assertSame(1800, $session->fresh()->duration);
    }

    public function test_user_cannot_see_another_users_sessions(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $this->actingAs($owner);
        $session = PomodoroSession::create([
            'date' => '2026-07-13',
            'start_time' => ['timestamp' => now()->subMinutes(30)->timestamp],
            'end_time' => ['timestamp' => now()->timestamp],
            'duration' => 1800,
            'completed' => true,
        ]);
        ModuleSetting::create([
            'module' => 'pomodoro',
            'settings' => ['weekday_goal_minutes' => 420],
        ]);

        $this->actingAs($otherUser);

        $this->assertNull(PomodoroSession::find($session->id));
        $this->assertNull(ModuleSetting::where('module', 'pomodoro')->first());
        $this->assertSame($owner->id, $session->user_id);
    }
}
