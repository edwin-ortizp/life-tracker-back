<?php

namespace Tests\Feature;

use App\Livewire\Health\HealthEditor;
use App\Livewire\Task\TaskEditor;
use App\Models\HealthEvent;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Livewire\Livewire;
use Tests\TestCase;

class EditorPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_draft_changes_do_not_query_the_history(): void
    {
        $this->actingAs(User::factory()->create());
        $editor = Livewire::test(HealthEditor::class);
        DB::enableQueryLog();
        DB::flushQueryLog();
        $editor->set('title', 'Draft')->set('type', 'symptom')->set('bodyAreas', ['head']);
        $this->assertSame([], DB::getQueryLog());
        DB::disableQueryLog();
    }

    public function test_task_draft_changes_do_not_query_the_list_or_statistics(): void
    {
        $this->actingAs(User::factory()->create());
        $editor = Livewire::test(TaskEditor::class);
        DB::enableQueryLog();
        DB::flushQueryLog();
        $editor->set('title', 'Draft')->set('description', 'Description');
        $this->assertSame([], DB::getQueryLog());
        DB::disableQueryLog();
    }

    public function test_health_editor_validates_then_notifies_the_list_after_saving(): void
    {
        $this->actingAs(User::factory()->create());
        Livewire::test(HealthEditor::class)->set('showForm', true)
            ->call('save')->assertHasErrors(['title', 'eventDate'])
            ->assertNotDispatched('health-records-changed')
            ->set('title', 'Synthetic appointment')->set('eventDate', '2026-01-01')
            ->call('save')->assertHasNoErrors()->assertSet('showForm', false)
            ->assertDispatched('health-records-changed');
        $this->assertSame(1, HealthEvent::count());
    }

    public function test_editors_cannot_load_another_users_records(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner);
        $event = HealthEvent::create(['title' => 'Private', 'type' => 'appointment', 'event_date' => today()]);
        $task = Task::create(['title' => 'Private', 'task_code' => 12345]);
        $this->actingAs(User::factory()->create());
        foreach ([[HealthEditor::class, $event->id], [TaskEditor::class, $task->id]] as [$class, $id]) {
            try {
                Livewire::test($class)->call('openForm', $id);
                $this->fail('An editor must not load another user\'s record.');
            } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
                $this->assertTrue(true);
            }
        }
    }

    public function test_health_paginates_without_losing_access_to_older_events(): void
    {
        $this->actingAs(User::factory()->create());
        foreach (range(1, 30) as $day) {
            HealthEvent::create(['title' => 'Day '.$day, 'type' => 'appointment', 'event_date' => sprintf('2026-01-%02d', $day)]);
        }
        Livewire::test(\App\Livewire\Health\HealthIndex::class)
            ->assertViewHas('events', fn ($events) => $events->count() === 25 && $events->total() === 30)
            ->call('setPage', 2)
            ->assertViewHas('events', fn ($events) => $events->count() === 5 && $events->first()->title === 'Day 5')
            ->call('applyFilters', 'all', 'all', ['appointment'])
            ->assertViewHas('events', fn ($events) => $events->currentPage() === 1);
    }

    public function test_task_editor_validates_and_notifies_after_saving(): void
    {
        $this->actingAs(User::factory()->create());
        Livewire::test(TaskEditor::class)->call('save')->assertHasErrors('title')
            ->assertNotDispatched('task-records-changed')
            ->set('title', 'Synthetic task')->call('save')->assertHasNoErrors()
            ->assertDispatched('task-records-changed');
        $this->assertSame(1, Task::count());
    }
}
