<?php

namespace Tests\Feature;

use App\Livewire\Health\HealthBodyMap;
use App\Livewire\Health\HealthIndex;
use App\Livewire\Task\TaskGantt;
use App\Livewire\Task\TaskPlanning;
use App\Models\HealthEvent;
use App\Models\HealthLog;
use App\Models\Task;
use App\Models\TaskAssociation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class HealthModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_future_medical_appointment_creates_a_linked_task_visible_in_task_views(): void
    {
        Carbon::setTestNow('2026-07-12 10:00:00');
        $user = User::factory()->create();
        $this->actingAs($user);

        Livewire::test(HealthIndex::class)
            ->call('openForm')
            ->set('type', 'appointment')
            ->set('title', 'Control de riñones')
            ->set('eventDate', '2026-08-15')
            ->set('provider', 'Nefrología Central')
            ->call('save')
            ->assertSet('showForm', false);

        $event = HealthEvent::firstOrFail();
        $task = Task::firstOrFail();
        $this->assertSame('appointment', $event->type);
        $this->assertSame('Nefrología Central', $event->details['provider']);
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'category' => 'salud', 'title' => 'Salud: Control de riñones', 'start_date' => '2026-08-15 00:00:00', 'end_date' => '2026-08-15 00:00:00']);
        $this->assertTrue($event->tasks()->whereKey($task->id)->exists());

        Livewire::test(TaskPlanning::class)->assertSee('Salud: Control de riñones');
        Livewire::test(TaskGantt::class)->call('nextMonth')->assertSee('Salud: Control de riñones');
        Carbon::setTestNow();
    }

    public function test_reprogramming_from_health_and_tasks_keeps_dates_synchronized(): void
    {
        Carbon::setTestNow('2026-07-12 10:00:00');
        $user = User::factory()->create();
        $this->actingAs($user);
        $event = HealthEvent::create(['type' => 'checkup', 'title' => 'Examen de sangre', 'event_date' => '2026-08-01']);
        $task = Task::create(['title' => 'Salud: Examen de sangre', 'category' => 'salud', 'start_date' => '2026-08-01', 'end_date' => '2026-08-01']);
        TaskAssociation::link($task, $event);

        Livewire::test(HealthIndex::class)
            ->call('openForm', $event->id)
            ->set('eventDate', '2026-08-08')
            ->call('save');
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'start_date' => '2026-08-08 00:00:00', 'end_date' => '2026-08-08 00:00:00']);

        $task->refresh()->update(['start_date' => '2026-08-20', 'end_date' => '2026-08-20']);
        $this->assertDatabaseHas('health_events', ['id' => $event->id, 'event_date' => '2026-08-20 00:00:00']);
        Carbon::setTestNow();
    }

    public function test_symptoms_validate_details_and_health_pending_is_only_a_task(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        Livewire::test(HealthIndex::class)
            ->call('openForm')
            ->set('type', 'symptom')
            ->set('title', 'Dolor de espalda')
            ->set('eventDate', '2026-07-12')
            ->set('bodyArea', 'back')
            ->set('initialIntensity', 11)
            ->call('save')
            ->assertHasErrors(['initialIntensity' => 'between']);

        Livewire::test(HealthIndex::class)
            ->call('openForm')
            ->set('type', 'symptom')
            ->set('title', 'Dolor de espalda')
            ->set('eventDate', '2026-07-12')
            ->set('bodyArea', 'back')
            ->set('initialIntensity', 3)
            ->call('save');

        $this->assertDatabaseHas('health_events', ['type' => 'symptom', 'title' => 'Dolor de espalda']);
        $this->assertSame('back', HealthEvent::where('type', 'symptom')->firstOrFail()->details['body_area']);
        $this->assertDatabaseHas('health_logs', ['intensity' => 3, 'date' => '2026-07-12 00:00:00']);

        Livewire::test(HealthIndex::class)
            ->call('openForm')
            ->set('type', 'illness')
            ->set('title', 'Malestar respiratorio')
            ->set('eventDate', '2026-07-12')
            ->set('illness', 'flu')
            ->set('initialIntensity', 5)
            ->call('save');

        $this->assertSame('flu', HealthEvent::where('type', 'illness')->firstOrFail()->details['condition']);

        Livewire::test(HealthIndex::class)
            ->call('openTaskForm')
            ->set('pendingTitle', 'Averiguar vacuna contra la fiebre amarilla')
            ->set('pendingDate', '2026-07-20')
            ->call('savePendingTask');

        $this->assertDatabaseCount('health_events', 2);
        $this->assertDatabaseHas('tasks', ['user_id' => $user->id, 'title' => 'Averiguar vacuna contra la fiebre amarilla', 'category' => 'salud']);
    }

    public function test_health_logs_track_daily_evolution_and_recovery(): void
    {
        Carbon::setTestNow('2026-07-12 10:00:00');
        $user = User::factory()->create();
        $this->actingAs($user);

        Livewire::test(HealthIndex::class)
            ->call('openForm')
            ->set('type', 'symptom')
            ->set('title', 'Dolor de garganta')
            ->set('eventDate', '2026-07-10')
            ->set('bodyArea', 'mouth_throat')
            ->set('initialIntensity', 3)
            ->call('save');

        $event = HealthEvent::firstOrFail();
        $initialLog = $event->logs()->firstOrFail();
        $this->assertSame(3, $initialLog->intensity);

        Livewire::test(HealthIndex::class)
            ->call('openLogForm', $event->id)
            ->set('logDate', '2026-07-11')
            ->set('logIntensity', 7)
            ->set('logNotes', 'Empeoró durante la noche')
            ->call('saveLog')
            ->assertSet('showLogForm', false)
            ->call('openLogForm', $event->id)
            ->set('logDate', '2026-07-09')
            ->set('logIntensity', 5)
            ->call('saveLog')
            ->assertHasErrors(['logDate'])
            ->call('editLog', $initialLog->id)
            ->set('logIntensity', 2)
            ->call('updateLog');

        $this->assertDatabaseHas('health_logs', ['id' => $initialLog->id, 'intensity' => 2]);
        $this->assertDatabaseCount('health_logs', 2);

        Livewire::test(HealthIndex::class)
            ->call('openRecoveryForm', $event->id)
            ->set('recoveryDate', '2026-07-12')
            ->set('recoveryIntensity', 1)
            ->call('saveRecovery');

        $this->assertSame('2026-07-12', $event->fresh()->end_date->toDateString());
        $this->assertDatabaseHas('health_logs', ['health_event_id' => $event->id, 'date' => '2026-07-12 00:00:00', 'intensity' => 1]);

        Livewire::test(HealthIndex::class)
            ->call('reopenEvolution', $event->id)
            ->call('openLogForm', $event->id)
            ->assertSet('showLogForm', true);
        $this->assertNull($event->fresh()->end_date);

        HealthLog::findOrFail($initialLog->id)->delete();
        $this->assertDatabaseCount('health_logs', 2);
        $event->delete();
        $this->assertDatabaseCount('health_logs', 0);
        Carbon::setTestNow();
    }

    public function test_health_events_are_private_to_their_owner_and_filters_are_url_backed(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $owner->healthEvents()->create(['type' => 'vaccination', 'title' => 'Influenza', 'event_date' => '2026-06-01']);
        $other->healthEvents()->create(['type' => 'symptom', 'title' => 'No visible', 'event_date' => '2026-06-01']);
        $this->actingAs($owner);

        Livewire::withQueryParams(['type' => 'vaccination', 'period' => 'history'])
            ->test(HealthIndex::class)
            ->assertSet('typeFilter', 'vaccination')
            ->assertSet('period', 'history')
            ->assertSee('Influenza')
            ->assertDontSee('No visible');
    }

    public function test_deleting_event_only_removes_its_link_not_the_task(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $event = $user->healthEvents()->create(['type' => 'checkup', 'title' => 'Control', 'event_date' => '2026-08-01']);
        $task = $user->tasks()->create(['title' => 'Salud: Control']);
        TaskAssociation::link($task, $event);

        Livewire::test(HealthIndex::class)->call('deleteEvent', $event->id);

        $this->assertDatabaseMissing('health_events', ['id' => $event->id]);
        $this->assertDatabaseHas('tasks', ['id' => $task->id]);
        $this->assertDatabaseMissing('task_associations', ['task_id' => $task->id, 'target_id' => $event->id]);
    }

    public function test_body_map_aggregates_structured_symptoms_and_has_its_own_route(): void
    {
        Carbon::setTestNow('2026-07-12 10:00:00');
        $user = User::factory()->create();
        $this->actingAs($user);
        $lumbarPain = $user->healthEvents()->create(['type' => 'symptom', 'title' => 'Dolor lumbar', 'event_date' => '2026-07-01', 'details' => ['body_area' => 'back']]);
        $lumbarPain->logs()->createMany([
            ['date' => '2026-07-10', 'intensity' => 4],
            ['date' => '2026-07-11', 'intensity' => 2],
        ]);
        $user->healthEvents()->create(['type' => 'symptom', 'title' => 'Dolor de cabeza', 'event_date' => '2026-07-11', 'details' => ['body_area' => 'head', 'severity' => 4]]);

        $this->get('/health/body')->assertOk()->assertSee('Vista del cuerpo')->assertSee('Mapa corporal');

        Livewire::withQueryParams(['period' => '30'])
            ->test(HealthBodyMap::class)
            ->assertSet('period', '30')
            ->assertSee('Espalda')
            ->assertSee('Cabeza')
            ->assertViewHas('areas', fn ($areas) => $areas['back']['count'] === 2 && $areas['back']['severity'] === 6);

        Carbon::setTestNow();
    }

    public function test_health_context_reports_next_event_and_pending_tasks(): void
    {
        Carbon::setTestNow('2026-07-12 10:00:00');
        $user = User::factory()->create();
        $this->actingAs($user);
        HealthEvent::create(['type' => 'appointment', 'title' => 'Cita posterior', 'event_date' => '2026-08-10']);
        $next = HealthEvent::create(['type' => 'checkup', 'title' => 'Control cercano', 'event_date' => '2026-07-20']);
        Task::create(['title' => 'Pedir autorización', 'category' => 'salud']);

        Livewire::test(HealthIndex::class)
            ->assertViewHas('nextEvent', fn (?HealthEvent $event) => $event?->is($next))
            ->assertViewHas('upcomingCount', 2)
            ->assertViewHas('pendingHealthTasks', 1)
            ->assertViewHas('healthTasks', fn ($tasks) => $tasks->contains('title', 'Pedir autorización'))
            ->assertSee('Control cercano');

        Carbon::setTestNow();
    }
}
