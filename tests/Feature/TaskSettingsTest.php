<?php

namespace Tests\Feature;

use App\Livewire\Task\TaskList;
use App\Livewire\Task\TaskSettings;
use App\Models\Task;
use App\Models\TaskCategory;
use App\Models\User;
use App\Support\DefaultTaskCategories;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class TaskSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_tab_renders_the_users_categories(): void
    {
        $user = User::factory()->create();
        DefaultTaskCategories::createFor($user);

        $this->actingAs($user)->get(route('tasks.settings'))
            ->assertOk()
            ->assertSee('Categorías')
            ->assertSee('Tecnología');
    }

    public function test_user_can_create_rename_and_see_category_in_task_list(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        Livewire::test(TaskSettings::class)
            ->call('openForm')
            ->set('name', 'Siigo')
            ->set('icon', 'bi-briefcase')
            ->call('save')
            ->assertHasNoErrors();

        $category = TaskCategory::firstOrFail();
        $this->assertSame('siigo', $category->key);

        Livewire::test(TaskSettings::class)
            ->call('openForm', $category->id)
            ->set('name', 'Siigo Nube')
            ->call('save');

        $this->assertSame('siigo', $category->fresh()->key);
        Livewire::test(TaskList::class)->assertSet('categories', ['siigo' => 'Siigo Nube']);
    }

    public function test_deleting_a_used_category_asks_where_to_move_tasks(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        DefaultTaskCategories::createFor($user);
        $task = Task::create(['title' => 'Barrer', 'category' => 'hogar']);
        $hogar = TaskCategory::where('key', 'hogar')->firstOrFail();

        Livewire::test(TaskSettings::class)
            ->call('delete', $hogar->id)
            ->assertSet('deletingId', $hogar->id)
            ->call('reassignAndDelete')
            ->assertSet('deletingId', null);

        $this->assertNull($task->fresh()->category);
        $this->assertModelMissing($hogar);
    }

    public function test_categories_can_be_reordered(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        DefaultTaskCategories::createFor($user);
        $second = TaskCategory::orderBy('sort_order')->skip(1)->firstOrFail();

        Livewire::test(TaskSettings::class)->call('move', $second->id, -1);

        $this->assertSame($second->key, array_key_first(TaskCategory::options()));
    }
}
