<?php

namespace Tests\Feature;

use App\Livewire\Relationship\RelationshipIndex;
use App\Livewire\Relationship\RelationshipShow;
use App\Models\Circle;
use App\Models\Relationship;
use App\Models\RelationshipContactMethod;
use App\Models\RelationshipEvent;
use App\Models\RelationshipTag;
use App\Models\Task;
use App\Models\TaskAssociation;
use App\Models\User;
use App\Support\EventDate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Livewire\Livewire;
use Tests\TestCase;

class RelationshipModuleTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-08-04 09:00:00');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_the_three_module_tabs_and_the_detail_page_render(): void
    {
        $relationship = Relationship::factory()->create(['user_id' => $this->user->id]);

        foreach (['/relationships', '/relationships/events', '/relationships/birthdays', '/relationships/'.$relationship->id] as $url) {
            $this->get($url)->assertOk()->assertSee('md-module-shell', false);
        }
    }

    public function test_a_minimal_profile_can_be_created_and_appears_in_the_list(): void
    {
        Livewire::test(RelationshipIndex::class)
            ->call('openForm')
            ->set('fullName', 'Alison Restrepo')
            ->call('save')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('relationships', [
            'user_id' => $this->user->id,
            'full_name' => 'Alison Restrepo',
        ]);

        Livewire::test(RelationshipIndex::class)->assertSee('Alison Restrepo');
    }

    public function test_a_full_profile_stores_personal_data_tags_and_contact_methods(): void
    {
        $circle = Circle::factory()->create(['user_id' => $this->user->id]);
        $tag = RelationshipTag::factory()->create(['user_id' => $this->user->id, 'name' => 'Universidad']);

        Livewire::test(RelationshipIndex::class)
            ->call('openForm')
            ->set('fullName', 'Alison Restrepo')
            ->set('nickname', 'Ali')
            ->set('pronouns', 'ella')
            ->set('occupation', 'Diseñadora')
            ->set('organization', 'Estudio Norte')
            ->set('address', 'Calle 5 #10-20')
            ->set('generalNotes', 'Le gusta el café frío.')
            ->set('circleId', $circle->id)
            ->set('category', 'amigo')
            ->set('birthdayMonth', 5)
            ->set('birthdayDay', 17)
            ->set('birthdayYear', 1990)
            ->set('contactFrequencyDays', 21)
            ->set('selectedTags', [$tag->id])
            ->set('contactMethods', [
                ['id' => null, 'type' => 'phone', 'label' => 'Personal', 'value' => '300 111 2233', 'is_primary' => true],
                ['id' => null, 'type' => 'email', 'label' => 'Trabajo', 'value' => 'ali@estudio.test', 'is_primary' => false],
            ])
            ->call('save')
            ->assertHasNoErrors();

        $relationship = Relationship::firstWhere('full_name', 'Alison Restrepo');

        $this->assertSame('ella', $relationship->pronouns);
        $this->assertSame(21, $relationship->contact_frequency_days);
        $this->assertSame(1990, $relationship->birthday_year);
        $this->assertSame(['Universidad'], $relationship->tags->pluck('name')->all());
        $this->assertCount(2, $relationship->contactMethods);
        $this->assertTrue($relationship->contactMethods->firstWhere('type', 'phone')->is_primary);
    }

    public function test_an_impossible_birthday_is_rejected(): void
    {
        Livewire::test(RelationshipIndex::class)
            ->call('openForm')
            ->set('fullName', 'Fecha imposible')
            ->set('birthdayMonth', 2)
            ->set('birthdayDay', 30)
            ->call('save')
            ->assertHasErrors('birthdayDay');

        $this->assertDatabaseMissing('relationships', ['full_name' => 'Fecha imposible']);
    }

    public function test_the_list_can_be_searched_by_contact_method_value(): void
    {
        $found = Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Camilo Vargas']);
        Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Marta Ríos']);

        RelationshipContactMethod::factory()->forRelationship($found)->create(['value' => '300 111 2233']);

        Livewire::test(RelationshipIndex::class)
            ->set('search', '3001112233')
            ->assertSee('Camilo Vargas')
            ->assertDontSee('Marta Ríos');

        Livewire::test(RelationshipIndex::class)
            ->set('search', '111 22')
            ->assertSee('Camilo Vargas')
            ->assertDontSee('Marta Ríos');
    }

    public function test_circle_tag_and_archive_filters_combine_and_live_in_the_url(): void
    {
        $circle = Circle::factory()->create(['user_id' => $this->user->id]);
        $tag = RelationshipTag::factory()->create(['user_id' => $this->user->id]);

        $matching = Relationship::factory()->create([
            'user_id' => $this->user->id,
            'circle_id' => $circle->id,
            'full_name' => 'Coincide Todo',
        ]);
        $matching->syncTags([$tag->id]);

        Relationship::factory()->create([
            'user_id' => $this->user->id,
            'circle_id' => $circle->id,
            'full_name' => 'Solo Circulo',
        ]);

        Livewire::test(RelationshipIndex::class)
            ->set('circleFilter', $circle->id)
            ->set('tagFilter', $tag->id)
            ->assertSee('Coincide Todo')
            ->assertDontSee('Solo Circulo');

        $this->get('/relationships?circle='.$circle->id.'&tag='.$tag->id)->assertOk()->assertSee('Coincide Todo');
    }

    public function test_archiving_keeps_events_and_task_associations(): void
    {
        $relationship = Relationship::factory()->create(['user_id' => $this->user->id]);
        RelationshipEvent::factory()->forRelationship($relationship)->create();
        $task = Task::create(['user_id' => $this->user->id, 'title' => 'Llamar']);
        TaskAssociation::link($task, $relationship);

        Livewire::test(RelationshipIndex::class)
            ->call('toggleArchive', $relationship->id)
            ->assertDontSee($relationship->full_name);

        $this->assertTrue($relationship->fresh()->is_archived);
        $this->assertDatabaseCount('relationship_events', 1);
        $this->assertDatabaseCount('task_associations', 1);

        Livewire::test(RelationshipIndex::class)
            ->set('showArchived', true)
            ->assertSee($relationship->full_name);
    }

    public function test_a_user_cannot_reach_another_users_relationship(): void
    {
        $other = User::factory()->create();
        $foreign = Relationship::factory()->create(['user_id' => $other->id, 'full_name' => 'Perfil Ajeno']);

        $this->get('/relationships/'.$foreign->id)->assertNotFound();

        Livewire::test(RelationshipIndex::class)
            ->assertDontSee('Perfil Ajeno');

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
        Livewire::test(RelationshipIndex::class)->call('delete', $foreign->id);
    }

    public function test_a_user_cannot_edit_another_users_contact_data_through_the_form(): void
    {
        $other = User::factory()->create();
        $foreign = Relationship::factory()->create(['user_id' => $other->id]);

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
        Livewire::test(RelationshipIndex::class)->call('openForm', $foreign->id);
    }

    public function test_circles_and_tags_can_be_managed_from_the_list(): void
    {
        $component = Livewire::test(RelationshipIndex::class)
            ->call('openCircleForm')
            ->set('circleName', 'Familia')
            ->set('circleFrequencyDays', 15)
            ->call('saveCircle')
            ->assertHasNoErrors();

        $circle = Circle::firstWhere('name', 'Familia');
        $this->assertSame(15, $circle->contact_frequency_days);

        $component->call('openTagForm')
            ->set('tagName', 'Universidad')
            ->call('saveTag')
            ->assertHasNoErrors();

        $tag = RelationshipTag::firstWhere('name', 'Universidad');
        $this->assertNotNull($tag);

        $relationship = Relationship::factory()->create(['user_id' => $this->user->id, 'circle_id' => $circle->id]);
        $relationship->syncTags([$tag->id]);

        $component->call('deleteCircle', $circle->id)
            ->call('deleteTag', $tag->id);

        $this->assertNull($relationship->fresh()->circle_id, 'Deleting a circle must not delete its relationships.');
        $this->assertDatabaseCount('relationship_tag_assignments', 0);
        $this->assertDatabaseHas('relationships', ['id' => $relationship->id]);
    }

    public function test_deleting_a_relationship_keeps_its_tasks(): void
    {
        $relationship = Relationship::factory()->create(['user_id' => $this->user->id]);
        $task = Task::create(['user_id' => $this->user->id, 'title' => 'Comprar regalo']);
        TaskAssociation::link($task, $relationship);

        Livewire::test(RelationshipIndex::class)->call('delete', $relationship->id);

        $this->assertDatabaseMissing('relationships', ['id' => $relationship->id]);
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'title' => 'Comprar regalo']);
        $this->assertDatabaseCount('task_associations', 0);
    }

    public function test_the_detail_shows_the_profile_its_timeline_and_its_tasks(): void
    {
        $relationship = Relationship::factory()->withBirthday(5, 17, 1990)
            ->create(['user_id' => $this->user->id, 'full_name' => 'Alison Restrepo']);

        RelationshipContactMethod::factory()->forRelationship($relationship)->primary()
            ->create(['value' => '300 111 2233']);
        RelationshipEvent::factory()->forRelationship($relationship)
            ->on(EventDate::fromInput(EventDate::MONTH, year: 2026, month: 11))
            ->create(['title' => 'Graduación']);

        $task = Task::create(['user_id' => $this->user->id, 'title' => 'Comprar regalo']);
        TaskAssociation::link($task, $relationship);

        Livewire::test(RelationshipShow::class, ['relationship' => $relationship->id])
            ->assertSee('Alison Restrepo')
            ->assertSee('300 111 2233')
            ->assertSee('Graduación')
            ->assertSee('noviembre de 2026')
            ->assertSee('Comprar regalo')
            ->assertSee('17 de mayo de 1990');
    }

    public function test_the_detail_rejects_another_users_relationship(): void
    {
        $other = User::factory()->create();
        $foreign = Relationship::factory()->create(['user_id' => $other->id]);

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
        Livewire::test(RelationshipShow::class, ['relationship' => $foreign->id]);
    }
}
