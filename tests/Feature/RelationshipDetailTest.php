<?php

namespace Tests\Feature;

use App\Livewire\Relationship\RelationshipHistory;
use App\Livewire\Relationship\RelationshipIndex;
use App\Livewire\Relationship\RelationshipShow;
use App\Livewire\Relationship\RelationshipTasks;
use App\Models\Plan;
use App\Models\PlanVisit;
use App\Models\Relationship;
use App\Models\RelationshipEvent;
use App\Models\Task;
use App\Models\TaskAssociation;
use App\Models\User;
use App\Support\EventDate;
use App\Support\Relationships\RelationshipAgenda;
use App\Support\Relationships\RelationshipQuickStats;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Livewire\Livewire;
use Tests\TestCase;

class RelationshipDetailTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Relationship $camila;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-08-04 09:00:00');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        $this->camila = Relationship::factory()->withBirthday(8, 30, 1995)->create([
            'user_id' => $this->user->id,
            'full_name' => 'Camila Rojas',
            'nickname' => 'Cami',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function linkTask(string $title, array $attributes = [], ?Relationship $to = null): Task
    {
        $task = Task::create(['user_id' => $this->user->id, 'title' => $title, ...$attributes]);
        TaskAssociation::link($task, $to ?? $this->camila);

        return $task;
    }

    private function event(string $title, string $date, array $attributes = []): RelationshipEvent
    {
        return RelationshipEvent::factory()->forRelationship($this->camila)
            ->on(EventDate::fromInput(EventDate::DAY, date: $date))
            ->create(['title' => $title, ...$attributes]);
    }

    private function visit(string $plan, string $date, ?string $comment = null, string $status = 'done'): PlanVisit
    {
        $planModel = Plan::factory()->for($this->user)->create(['title' => $plan, 'status' => $status]);
        $visit = PlanVisit::factory()->create(['plan_id' => $planModel->id, 'user_id' => $this->user->id, 'visited_on' => $date, 'comment' => $comment]);
        $visit->relationships()->attach($this->camila->id);

        return $visit;
    }

    public function test_the_agenda_merges_tasks_events_plans_and_the_birthday_by_date(): void
    {
        $this->linkTask('Enviarle el libro');
        $this->linkTask('Llamar para ponernos al día', ['end_date' => '2026-08-10']);
        $this->linkTask('Tarea ya hecha', ['end_date' => '2026-08-05', 'completed' => true, 'completed_at' => now()]);
        $this->event('Graduación', '2026-08-20');
        $this->event('Boda de Andrés', '2026-07-01');
        Plan::factory()->for($this->user)->scheduled('2026-08-15')->create(['title' => 'Cena de reencuentro'])
            ->relationships()->attach($this->camila->id);

        $this->assertSame(
            ['Llamar para ponernos al día', 'Cena de reencuentro', 'Graduación', 'Cumpleaños de Cami', 'Enviarle el libro'],
            RelationshipAgenda::upcoming($this->camila, null)->pluck('title')->all(),
        );
        $this->assertCount(3, RelationshipAgenda::upcoming($this->camila, 3));
    }

    public function test_the_home_tab_prioritises_what_needs_managing(): void
    {
        $this->linkTask('Reservar restaurante', ['end_date' => '2026-08-01']);
        $this->visit("Restaurante Storia D'Amore", '2026-07-01', 'Pedimos la lasaña');
        $this->event('Boda de Andrés', '2026-06-14');

        Livewire::test(RelationshipShow::class, ['relationship' => $this->camila->id])
            ->assertSeeInOrder(['Pendientes y próximos', 'Reservar restaurante', 'Vencida', 'Historial reciente', "Restaurante Storia D'Amore", 'Boda de Andrés'])
            ->assertSee('Ver todas')
            ->assertSee('Ver historial completo')
            ->assertSee('Información de contacto')
            ->assertSee('Estadísticas rápidas')
            ->assertSee('Medios de contacto')
            ->assertDontSee('Cronología');
    }

    public function test_tasks_can_be_completed_reopened_and_unlinked(): void
    {
        $task = $this->linkTask('Llamar a Camila');

        Livewire::test(RelationshipShow::class, ['relationship' => $this->camila->id])
            ->call('toggleTask', $task->id)
            ->assertDontSee('Llamar a Camila');
        $this->assertTrue($task->fresh()->completed);

        Livewire::test(RelationshipTasks::class, ['relationship' => $this->camila->id])
            ->call('setStatus', 'completed')
            ->assertSee('Llamar a Camila')
            ->call('toggleTask', $task->id);
        $this->assertFalse($task->fresh()->completed);

        Livewire::test(RelationshipTasks::class, ['relationship' => $this->camila->id])
            ->assertSee('Llamar a Camila')
            ->call('unlinkTask', $task->id)
            ->assertDontSee('Llamar a Camila');

        // Only the link goes away: the task stays in Tareas.
        $this->assertDatabaseHas('tasks', ['id' => $task->id]);
        $this->assertDatabaseCount('task_associations', 0);
    }

    public function test_the_tasks_tab_searches_and_counts_by_status(): void
    {
        $this->linkTask('Comprar regalo');
        $this->linkTask('Llamar a Camila');
        $this->linkTask('Enviar fotos', ['completed' => true, 'completed_at' => now()]);

        Livewire::test(RelationshipTasks::class, ['relationship' => $this->camila->id])
            ->assertSee('Pendientes (2)')
            ->assertSee('Completadas (1)')
            ->assertSee('(2 / 3)')
            ->set('search', 'regalo')
            ->assertSee('Comprar regalo')
            ->assertDontSee('Llamar a Camila');
    }

    public function test_a_task_linked_to_another_person_cannot_be_touched_from_this_detail(): void
    {
        $other = Relationship::factory()->create(['user_id' => $this->user->id]);
        $task = $this->linkTask('Tarea ajena', [], $other);

        $this->expectException(ModelNotFoundException::class);
        Livewire::test(RelationshipTasks::class, ['relationship' => $this->camila->id])->call('unlinkTask', $task->id);
    }

    public function test_the_history_lists_past_events_and_plan_visits_with_filters(): void
    {
        $this->event('Boda de Andrés', '2026-06-14', ['notes' => 'Bailamos toda la noche']);
        $this->event('Nos vimos en café', '2026-01-12', ['category' => 'conversation']);
        $this->event('Graduación', '2026-11-14');
        $this->visit("Restaurante Storia D'Amore", '2026-07-01', 'Pedimos la lasaña');

        Livewire::test(RelationshipHistory::class, ['relationship' => $this->camila->id])
            ->assertSeeInOrder(["Restaurante Storia D'Amore", 'Boda de Andrés', 'Nos vimos en café'])
            ->assertDontSee('Graduación')
            ->assertSee('(3 / 3)')
            ->call('setType', 'plan')
            ->assertSee("Restaurante Storia D'Amore")
            ->assertDontSee('Boda de Andrés')
            ->call('setType', '')
            ->set('category', 'conversation')
            ->assertSee('Nos vimos en café')
            ->assertDontSee('Boda de Andrés')
            ->assertDontSee("Restaurante Storia D'Amore")
            ->call('clearFilters')
            ->set('search', 'lasaña')
            ->assertSee("Restaurante Storia D'Amore")
            ->assertDontSee('Boda de Andrés');
    }

    public function test_the_history_paginates_as_a_management_card(): void
    {
        foreach (range(1, 12) as $day) {
            $this->event('Momento '.$day, sprintf('2026-07-%02d', $day));
        }

        Livewire::test(RelationshipHistory::class, ['relationship' => $this->camila->id])
            ->set('perPage', 10)
            ->assertSee('(12 / 12)')
            ->assertSeeHtml('Mostrando <strong>1–10</strong> de <strong>12</strong> registros')
            ->assertSee('Momento 12')
            ->assertSee('Momento 3')
            ->assertDontSee('Momento 2');
    }

    public function test_quick_stats_summarise_contact_frequency_moments_and_pending_plans(): void
    {
        $this->camila->update(['last_contact_at' => Carbon::parse('2026-07-27'), 'contact_frequency_days' => 30]);
        $this->event('Mensaje de cumpleaños', '2026-03-03');
        $this->event('Graduación', '2026-11-14');
        $this->event('Cena del año pasado', '2025-12-20');
        $this->visit("Restaurante Storia D'Amore", '2026-07-01');
        Plan::factory()->for($this->user)->create(['title' => 'Termales', 'status' => 'pending'])->relationships()->attach($this->camila->id);

        $stats = collect(RelationshipQuickStats::for($this->camila->fresh()))->pluck('value', 'label');

        $this->assertSame('Hace 8 días', $stats['Último contacto']);
        $this->assertSame('Cada mes', $stats['Frecuencia deseada']);
        $this->assertSame('2', $stats['Momentos este año']);
        $this->assertSame('1', $stats['Planes pendientes']);
    }

    public function test_editing_the_contact_from_the_detail_opens_its_form_in_the_list(): void
    {
        Livewire::withQueryParams(['edit' => $this->camila->id])
            ->test(RelationshipIndex::class)
            ->assertSet('showForm', true)
            ->assertSet('editingId', $this->camila->id);

        $foreign = Relationship::factory()->create(['user_id' => User::factory()->create()->id]);

        Livewire::withQueryParams(['edit' => $foreign->id])
            ->test(RelationshipIndex::class)
            ->assertSet('showForm', false);
    }

    public function test_person_pages_integrate_the_back_link_into_their_tab_row(): void
    {
        foreach (['', '/plans', '/history', '/tasks'] as $suffix) {
            $html = $this->get('/relationships/'.$this->camila->id.$suffix)->assertOk()->getContent();

            $this->assertStringContainsString('md-module-tabs__back', $html, $suffix);
            $this->assertStringContainsString('aria-label="Volver a Relaciones"', $html, $suffix);
            $this->assertStringContainsString('Tareas relacionadas', $html, $suffix);
            $this->assertStringNotContainsString('aria-label="Vistas del módulo"', $html, $suffix);
            $this->assertStringNotContainsString('</i> Volver a Relaciones', $html, $suffix);
        }
    }

    public function test_a_plan_detail_puts_the_back_link_in_the_top_bar(): void
    {
        $plan = Plan::factory()->for($this->user)->create(['title' => 'Heladería Popsy']);

        $html = $this->get('/plans/'.$plan->id)->assertOk()->getContent();

        $this->assertStringContainsString('aria-label="Volver a Planes"', $html);
        $this->assertStringNotContainsString('plans-back', $html);
        $this->assertLessThan(strpos($html, 'lt-topbar__icon'), strpos($html, 'lt-topbar__back'));
    }
}
