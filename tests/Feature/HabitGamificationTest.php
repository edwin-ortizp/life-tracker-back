<?php

namespace Tests\Feature;

use App\Livewire\Habit\HabitTracker;
use App\Livewire\Habit\HabitWeekly;
use App\Models\HabitCompletion;
use App\Models\HabitDefinition;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Livewire\Livewire;
use Tests\TestCase;

class HabitGamificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2026-07-13 10:00:00', 'America/Bogota'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_today_feedback_prioritizes_period_and_day_completion(): void
    {
        $this->actingAs(User::factory()->create());
        $stretch = $this->habit('Estirar', 'morning');
        $meditate = $this->habit('Meditar', 'morning');
        $read = $this->habit('Leer', 'night');
        $this->complete($stretch, '2026-07-13');

        $component = Livewire::test(HabitTracker::class)
            ->call('toggleHabit', $meditate->id)
            ->assertDispatched('habit-feedback', kind: 'period', tone: 'success', period: 'morning')
            ->assertViewHas('coachCard', fn (array $card) => $card['state'] === 'period');

        $component->call('toggleHabit', $read->id)
            ->assertDispatched('habit-feedback', kind: 'day', tone: 'celebration')
            ->assertViewHas('coachCard', fn (array $card) => $card['state'] === 'complete');
    }

    public function test_streak_milestone_wins_over_regular_habit_feedback(): void
    {
        $this->actingAs(User::factory()->create());
        $meditate = $this->habit('Meditar', 'morning');
        $this->habit('Estirar', 'morning');
        $this->complete($meditate, '2026-07-11');
        $this->complete($meditate, '2026-07-12');

        Livewire::test(HabitTracker::class)
            ->call('toggleHabit', $meditate->id)
            ->assertDispatched('habit-feedback', kind: 'streak', tone: 'support', streak: 3, habitId: $meditate->id);
    }

    public function test_regular_completion_uses_warm_local_feedback(): void
    {
        $this->actingAs(User::factory()->create());
        $water = $this->habit('Tomar agua', 'morning');
        $this->habit('Respirar', 'morning');

        Livewire::test(HabitTracker::class)
            ->call('toggleHabit', $water->id)
            ->assertDispatched('habit-feedback', kind: 'habit', tone: 'success', habitId: $water->id)
            ->assertSee('Tomar agua');
    }

    public function test_historical_edits_and_reopening_use_neutral_feedback(): void
    {
        $this->actingAs(User::factory()->create());
        $habit = $this->habit('Caminar', 'afternoon');

        Livewire::withQueryParams(['date' => '2026-07-12'])
            ->test(HabitTracker::class)
            ->call('toggleHabit', $habit->id)
            ->assertDispatched('habit-feedback', kind: 'history', tone: 'neutral', date: '2026-07-12');

        $this->complete($habit, '2026-07-13');
        Livewire::withQueryParams(['date' => '2026-07-13'])
            ->test(HabitTracker::class)
            ->call('toggleHabit', $habit->id)
            ->assertDispatched('habit-feedback', kind: 'habit', tone: 'neutral', date: '2026-07-13');
    }

    public function test_daily_coach_recommends_a_concrete_recovery_step_without_punishment(): void
    {
        $this->actingAs(User::factory()->create());
        $stretch = $this->habit('Estirar', 'morning');
        $read = $this->habit('Leer', 'night');
        $stretch->forceFill(['created_at' => '2026-07-12 08:00:00'])->saveQuietly();
        $read->forceFill(['created_at' => '2026-07-12 08:00:00'])->saveQuietly();
        $this->complete($stretch, '2026-07-12');

        Livewire::test(HabitTracker::class)
            ->assertViewHas('coachCard', function (array $card): bool {
                return $card['state'] === 'recovery'
                    && $card['tone'] === 'support'
                    && $card['suggestedHabitId'] !== null
                    && str_contains($card['message'], 'Estirar');
            })
            ->assertSee('Volver también cuenta')
            ->assertSeeHtml('aria-live="polite"');
    }

    public function test_new_habits_do_not_create_recovery_debt_for_days_before_they_existed(): void
    {
        $this->actingAs(User::factory()->create());
        $this->habit('Respirar', 'morning');

        Livewire::test(HabitTracker::class)
            ->assertViewHas('coachCard', fn (array $card) => $card['state'] === 'next')
            ->assertDontSee('Volver también cuenta');
    }

    public function test_weekly_insights_are_deterministic_and_isolated_per_user(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-15 10:00:00', 'America/Bogota'));
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($user);
        $meditate = $this->habit('Meditar', 'morning');
        $read = $this->habit('Leer', 'night');

        foreach (['2026-07-13', '2026-07-14', '2026-07-15'] as $date) {
            $this->complete($meditate, $date);
        }
        $this->complete($read, '2026-07-13');

        $foreignHabit = HabitDefinition::withoutGlobalScopes()->forceCreate([
            'user_id' => $other->id,
            'name' => 'Hábito ajeno',
            'time_of_day' => 'morning',
        ]);
        HabitCompletion::withoutGlobalScopes()->forceCreate([
            'user_id' => $other->id,
            'habit_id' => $foreignHabit->id,
            'date' => '2026-07-15',
            'completed' => true,
        ]);

        Livewire::withQueryParams(['date' => '2026-07-15'])
            ->test(HabitWeekly::class)
            ->assertViewHas('insights', function (Collection $insights): bool {
                return $insights->count() === 3
                    && $insights[0]['kind'] === 'consistent'
                    && $insights[0]['value'] === 'Meditar'
                    && $insights[1]['kind'] === 'period'
                    && $insights[1]['value'] === 'Mañana'
                    && $insights[2]['kind'] === 'focus'
                    && $insights[2]['value'] === 'Leer'
                    && ! str_contains($insights->pluck('message')->implode(' '), 'ajeno');
            })
            ->assertSee('Lo que cuenta tu semana')
            ->assertSee('Privado');
    }

    public function test_future_week_uses_an_insufficient_data_message_instead_of_a_diagnosis(): void
    {
        $this->actingAs(User::factory()->create());
        $this->habit('Meditar', 'morning');

        Livewire::withQueryParams(['date' => '2026-07-20'])
            ->test(HabitWeekly::class)
            ->assertViewHas('insights', fn (Collection $insights) => $insights->count() === 1 && $insights->first()['kind'] === 'future')
            ->assertSee('Semana por comenzar')
            ->assertDontSee('Un hábito para retomar');
    }

    private function habit(string $name, string $period): HabitDefinition
    {
        return HabitDefinition::create([
            'name' => $name,
            'time_of_day' => $period,
        ]);
    }

    private function complete(HabitDefinition $habit, string $date): HabitCompletion
    {
        return HabitCompletion::create([
            'habit_id' => $habit->id,
            'date' => $date,
            'completed' => true,
        ]);
    }
}
