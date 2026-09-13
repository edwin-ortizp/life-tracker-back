<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Relationship\AddContactAliasTool;
use App\Mcp\Tools\Relationship\AddContactMethodTool;
use App\Mcp\Tools\Relationship\RemoveContactMethodTool;
use App\Mcp\Tools\Relationship\CreateContactTool;
use App\Mcp\Tools\Relationship\ListContactsTool;
use App\Mcp\Tools\Relationship\ListUpcomingBirthdaysTool;
use App\Mcp\Tools\Relationship\LogRelationshipEventTool;
use App\Mcp\Tools\Relationship\UpdateContactTool;
use App\Models\Relationship;
use App\Models\RelationshipContactMethod;
use App\Models\RelationshipEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LifeTrackerRelationshipMcpTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_contact_tool_creates_a_contact_with_a_birthday(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(CreateContactTool::class, [
                'full_name' => 'Carlos Pérez',
                'category' => 'amigo',
                'birthday_month' => 5,
                'birthday_day' => 20,
            ])
            ->assertOk()
            ->assertSee('Carlos Pérez')
            ->assertSee('Cumpleaños');

        $this->assertDatabaseHas('relationships', [
            'user_id' => $user->id,
            'full_name' => 'Carlos Pérez',
            'birthday_month' => 5,
            'birthday_day' => 20,
        ]);
    }

    public function test_create_contact_tool_rejects_an_impossible_birthday_combination(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(CreateContactTool::class, [
                'full_name' => 'Alguien',
                'birthday_month' => 2,
                'birthday_day' => 30,
            ])
            ->assertHasErrors();

        $this->assertSame(0, Relationship::where('user_id', $user->id)->count());
    }

    public function test_update_contact_tool_adds_a_birthday_to_an_existing_contact(): void
    {
        $user = User::factory()->create();
        $relationship = $user->relationships()->create(['full_name' => 'Ana López', 'category' => 'trabajo']);

        LifeTrackerServer::actingAs($user)
            ->tool(UpdateContactTool::class, [
                'contact_id' => $relationship->id,
                'birthday_month' => 11,
                'birthday_day' => 3,
            ])
            ->assertOk()
            ->assertSee('Cumpleaños');

        $this->assertSame(11, $relationship->fresh()->birthday_month);
        $this->assertSame(3, $relationship->fresh()->birthday_day);
    }

    public function test_log_relationship_event_tool_resolves_a_unique_contact_by_name(): void
    {
        $user = User::factory()->create();
        $relationship = $user->relationships()->create(['full_name' => 'Carlos Pérez', 'category' => 'amigo']);

        LifeTrackerServer::actingAs($user)
            ->tool(LogRelationshipEventTool::class, [
                'name' => 'Carlos',
                'title' => 'Se graduó',
                'category' => 'milestone',
                'date' => today()->toDateString(),
            ])
            ->assertOk()
            ->assertSee('Se graduó');

        $this->assertSame(1, RelationshipEvent::where('relationship_id', $relationship->id)->count());
    }

    public function test_log_relationship_event_tool_errors_on_zero_matching_contacts(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(LogRelationshipEventTool::class, [
                'name' => 'Nadie',
                'title' => 'Algo',
                'category' => 'other',
                'date' => today()->toDateString(),
            ])
            ->assertHasErrors();
    }

    public function test_log_relationship_event_tool_errors_on_ambiguous_name_and_lists_candidates(): void
    {
        $user = User::factory()->create();
        $user->relationships()->create(['full_name' => 'Ana López', 'category' => 'amigo']);
        $user->relationships()->create(['full_name' => 'Ana Martínez', 'category' => 'amigo']);

        LifeTrackerServer::actingAs($user)
            ->tool(LogRelationshipEventTool::class, [
                'name' => 'Ana',
                'title' => 'Algo',
                'category' => 'other',
                'date' => today()->toDateString(),
            ])
            ->assertHasErrors()
            ->assertSee('Ana López')
            ->assertSee('Ana Martínez');
    }

    public function test_list_contacts_tool_only_returns_the_authenticated_users_contacts(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $owner->relationships()->create(['full_name' => 'Mi contacto', 'category' => 'amigo']);
        $otherUser->relationships()->create(['full_name' => 'Contacto ajeno', 'category' => 'amigo']);

        LifeTrackerServer::actingAs($owner)
            ->tool(ListContactsTool::class, [])
            ->assertOk()
            ->assertSee('Mi contacto')
            ->assertDontSee('Contacto ajeno');
    }

    public function test_add_contact_alias_tool_adds_an_alias(): void
    {
        $user = User::factory()->create();
        $relationship = $user->relationships()->create(['full_name' => 'Alison Gómez', 'category' => 'amigo']);

        LifeTrackerServer::actingAs($user)
            ->tool(AddContactAliasTool::class, ['contact_id' => $relationship->id, 'alias' => 'Ali'])
            ->assertOk()
            ->assertSee('Ali');

        $this->assertDatabaseHas('relationship_aliases', [
            'relationship_id' => $relationship->id,
            'alias' => 'Ali',
        ]);
    }

    public function test_add_contact_alias_tool_does_not_duplicate_an_existing_alias(): void
    {
        $user = User::factory()->create();
        $relationship = $user->relationships()->create(['full_name' => 'Alison Gómez', 'category' => 'amigo']);
        $this->actingAs($user);
        $relationship->aliases()->create(['alias' => 'Ali']);

        LifeTrackerServer::actingAs($user)
            ->tool(AddContactAliasTool::class, ['contact_id' => $relationship->id, 'alias' => 'Ali'])
            ->assertOk()
            ->assertSee('ya estaba registrado');

        $this->assertSame(1, $relationship->aliases()->count());
    }

    public function test_log_relationship_event_tool_resolves_a_contact_by_alias(): void
    {
        $user = User::factory()->create();
        $relationship = $user->relationships()->create(['full_name' => 'Alison Gómez', 'category' => 'amigo']);
        $this->actingAs($user);
        $relationship->aliases()->create(['alias' => 'Ali']);

        LifeTrackerServer::actingAs($user)
            ->tool(LogRelationshipEventTool::class, [
                'name' => 'Ali',
                'title' => 'Se graduó',
                'category' => 'milestone',
                'date' => today()->toDateString(),
            ])
            ->assertOk()
            ->assertSee('Alison Gómez');
    }

    public function test_list_upcoming_birthdays_tool_orders_by_days_until(): void
    {
        $user = User::factory()->create();
        $soon = today()->addDays(3);
        $later = today()->addDays(20);
        $user->relationships()->create([
            'full_name' => 'Cumple lejano', 'category' => 'amigo',
            'birthday_month' => $later->month, 'birthday_day' => $later->day,
        ]);
        $user->relationships()->create([
            'full_name' => 'Cumple cercano', 'category' => 'amigo',
            'birthday_month' => $soon->month, 'birthday_day' => $soon->day,
        ]);

        LifeTrackerServer::actingAs($user)
            ->tool(ListUpcomingBirthdaysTool::class, [])
            ->assertOk()
            ->assertSee('Cumple cercano')
            ->assertSee('Cumple lejano');
    }

    public function test_update_contact_tool_saves_location_and_an_encrypted_document(): void
    {
        $user = User::factory()->create();
        $relationship = $user->relationships()->create(['full_name' => 'Camila Rojas', 'category' => 'amigo']);

        LifeTrackerServer::actingAs($user)
            ->tool(UpdateContactTool::class, [
                'name' => 'Camila',
                'city' => 'Medellín',
                'address' => 'Cra. 43A # 1-50',
                'occupation' => 'Diseñadora',
                'document_type' => 'cc',
                'document_number' => '1061234567',
            ])
            ->assertOk();

        $relationship->refresh();
        $this->assertSame('Medellín', $relationship->city);
        $this->assertSame('Cra. 43A # 1-50', $relationship->address);
        $this->assertSame('1061234567', $relationship->document_number);
        $this->assertNotSame('1061234567', \Illuminate\Support\Facades\DB::table('relationships')->where('id', $relationship->id)->value('document_number'));
    }

    public function test_update_contact_tool_requires_a_document_type(): void
    {
        $user = User::factory()->create();
        $user->relationships()->create(['full_name' => 'Camila Rojas', 'category' => 'amigo']);

        LifeTrackerServer::actingAs($user)
            ->tool(UpdateContactTool::class, ['name' => 'Camila', 'document_number' => '1061234567'])
            ->assertHasErrors()
            ->assertSee('document_type');
    }

    public function test_contact_methods_can_be_added_without_duplicates_and_removed(): void
    {
        $user = User::factory()->create();
        $relationship = $user->relationships()->create(['full_name' => 'Camila Rojas', 'category' => 'amigo']);

        foreach ([
            ['type' => 'phone', 'value' => '+57 310 555 0142', 'label' => 'Personal', 'is_primary' => true],
            ['type' => 'phone', 'value' => '+57 604 444 1234', 'label' => 'Casa'],
            ['type' => 'instagram', 'value' => '@camirojas'],
        ] as $method) {
            LifeTrackerServer::actingAs($user)
                ->tool(AddContactMethodTool::class, ['name' => 'Camila'] + $method)
                ->assertOk()
                ->assertSee('agregado');
        }

        LifeTrackerServer::actingAs($user)
            ->tool(AddContactMethodTool::class, ['name' => 'Camila', 'type' => 'phone', 'value' => '+573105550142'])
            ->assertOk()
            ->assertSee('ya tenía');

        $this->assertSame(3, RelationshipContactMethod::withoutGlobalScopes()->where('relationship_id', $relationship->id)->count());

        LifeTrackerServer::actingAs($user)
            ->tool(RemoveContactMethodTool::class, ['name' => 'Camila', 'value' => '604 444 1234'])
            ->assertOk()
            ->assertSee('eliminado');

        LifeTrackerServer::actingAs($user)
            ->tool(ListContactsTool::class, ['name' => 'Camila'])
            ->assertOk()
            ->assertSee('310 555 0142')
            ->assertSee('@camirojas')
            ->assertDontSee('604 444 1234');
    }

    public function test_create_contact_tool_accepts_contact_methods_and_list_masks_the_document(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(CreateContactTool::class, [
                'full_name' => 'Daniel Pérez',
                'city' => 'Bogotá',
                'document_type' => 'cc',
                'document_number' => '80123456',
                'contact_methods' => [
                    ['type' => 'whatsapp', 'value' => '+57 300 111 2233'],
                    ['type' => 'email', 'value' => 'daniel@example.com'],
                ],
            ])
            ->assertOk()
            ->assertSee('Medios de contacto: 2');

        LifeTrackerServer::actingAs($user)
            ->tool(ListContactsTool::class, ['name' => 'Daniel'])
            ->assertOk()
            ->assertSee('Bogotá')
            ->assertSee('terminado en 3456')
            ->assertSee('daniel@example.com')
            ->assertDontSee('80123456');
    }
}
