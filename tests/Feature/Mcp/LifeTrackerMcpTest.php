<?php

namespace Tests\Feature\Mcp;

use App\Livewire\Settings\SettingsPage;
use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Habit\CompleteHabitTool;
use App\Mcp\Tools\Habit\ListHabitsTool;
use App\Mcp\Tools\Health\ListHealthEventsTool;
use App\Mcp\Tools\Health\LogHealthEventTool;
use App\Mcp\Tools\Task\CompleteTaskTool;
use App\Mcp\Tools\Task\CreateTaskTool;
use App\Mcp\Tools\Task\ListTasksTool;
use App\Models\HealthEvent;
use App\Models\IntegrationToken;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class LifeTrackerMcpTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_generate_and_revoke_their_ai_token(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $component = Livewire::test(SettingsPage::class)
            ->call('createOrRotateAiToken')
            ->assertSet('successMessage', 'Token de IA generado. Cópialo ahora: no volverá a mostrarse.');

        $plainTextToken = $component->get('aiIntegrationToken');

        $this->assertStringStartsWith(IntegrationToken::AI_PREFIX, $plainTextToken);
        $this->assertDatabaseHas('integration_tokens', [
            'user_id' => $user->id,
            'purpose' => 'ai',
            'token_hash' => hash('sha256', $plainTextToken),
            'revoked_at' => null,
        ]);

        $component->call('revokeAiToken');

        $this->assertNotNull(
            IntegrationToken::where('purpose', 'ai')->firstOrFail()->fresh()->revoked_at
        );
    }

    public function test_mcp_endpoint_rejects_requests_without_a_valid_token(): void
    {
        $this->postJson('/life-tracker', [])->assertUnauthorized();
        $this->withToken('lt_ai_not-a-real-token')->postJson('/life-tracker', [])->assertUnauthorized();
    }

    public function test_create_task_tool_creates_a_task_for_the_authenticated_user(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(CreateTaskTool::class, [
                'title' => 'Comprar leche',
                'category' => 'compras',
                'priority' => 'urgent-important',
                'size' => 'XS',
            ])
            ->assertOk()
            ->assertSee('Comprar leche');

        $task = Task::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('Comprar leche', $task->title);
        $this->assertSame('compras', $task->category);
        $this->assertFalse($task->completed);
    }

    public function test_complete_task_tool_completes_and_reopens_a_task(): void
    {
        $user = User::factory()->create();
        $task = $user->tasks()->create([
            'task_code' => 12345,
            'title' => 'Pagar factura',
            'size' => 'S',
            'priority' => 'not-urgent-important',
        ]);

        LifeTrackerServer::actingAs($user)
            ->tool(CompleteTaskTool::class, ['task_id' => $task->id, 'action' => 'complete'])
            ->assertOk()
            ->assertSee('completada');

        $this->assertTrue($task->fresh()->completed);

        LifeTrackerServer::actingAs($user)
            ->tool(CompleteTaskTool::class, ['task_id' => $task->id, 'action' => 'reopen'])
            ->assertOk()
            ->assertSee('pendiente');

        $this->assertFalse($task->fresh()->completed);
    }

    public function test_list_tasks_tool_only_returns_the_authenticated_users_tasks(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $owner->tasks()->create(['task_code' => 1, 'title' => 'Mía']);
        $otherUser->tasks()->create(['task_code' => 2, 'title' => 'Ajena']);

        LifeTrackerServer::actingAs($owner)
            ->tool(ListTasksTool::class, ['status' => 'all'])
            ->assertOk()
            ->assertSee('Mía')
            ->assertDontSee('Ajena');
    }

    public function test_complete_habit_tool_toggles_a_habit_completion(): void
    {
        $user = User::factory()->create();
        $habit = $user->habitDefinitions()->create(['name' => 'Meditar', 'time_of_day' => 'morning']);

        LifeTrackerServer::actingAs($user)
            ->tool(CompleteHabitTool::class, ['habit_id' => $habit->id, 'date' => today()->toDateString()])
            ->assertOk();

        $this->assertDatabaseHas('habit_completions', [
            'habit_id' => $habit->id,
            'user_id' => $user->id,
            'completed' => true,
        ]);
    }

    public function test_complete_habit_tool_rejects_a_habit_belonging_to_another_user(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $habit = $owner->habitDefinitions()->create(['name' => 'Leer', 'time_of_day' => 'night']);

        LifeTrackerServer::actingAs($attacker)
            ->tool(CompleteHabitTool::class, ['habit_id' => $habit->id])
            ->assertHasErrors();

        $this->assertDatabaseMissing('habit_completions', ['habit_id' => $habit->id]);
    }

    public function test_list_habits_tool_reports_todays_completion_state(): void
    {
        $user = User::factory()->create();
        $habit = $user->habitDefinitions()->create(['name' => 'Estirar', 'time_of_day' => 'morning']);
        $user->habitCompletions()->create(['habit_id' => $habit->id, 'date' => today(), 'completed' => true]);

        LifeTrackerServer::actingAs($user)
            ->tool(ListHabitsTool::class)
            ->assertOk()
            ->assertSee('Estirar');
    }

    public function test_log_health_event_tool_creates_an_event_and_initial_log_for_symptoms(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(LogHealthEventTool::class, [
                'type' => 'symptom',
                'title' => 'Dolor de cabeza',
                'event_date' => today()->toDateString(),
                'initial_intensity' => 6,
            ])
            ->assertOk()
            ->assertSee('Dolor de cabeza');

        $event = HealthEvent::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('symptom', $event->type);
        $this->assertSame(1, $event->logs()->count());
        $this->assertSame(6, $event->logs()->first()->intensity);
    }

    public function test_log_health_event_tool_requires_intensity_for_symptoms(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(LogHealthEventTool::class, [
                'type' => 'symptom',
                'title' => 'Dolor de espalda',
                'event_date' => today()->toDateString(),
            ])
            ->assertHasErrors();

        $this->assertSame(0, HealthEvent::where('user_id', $user->id)->count());
    }

    public function test_list_health_events_tool_only_returns_the_authenticated_users_events(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $owner->healthEvents()->create(['type' => 'appointment', 'title' => 'Mi cita', 'event_date' => today()]);
        $otherUser->healthEvents()->create(['type' => 'appointment', 'title' => 'Cita ajena', 'event_date' => today()]);

        LifeTrackerServer::actingAs($owner)
            ->tool(ListHealthEventsTool::class, ['period' => 'all'])
            ->assertOk()
            ->assertSee('Mi cita')
            ->assertDontSee('Cita ajena');
    }
}
