<?php

namespace Tests\Feature;

use App\Livewire\Meal\BulkIngredientAssistant;
use App\Livewire\Meal\MealIngredients;
use App\Models\ShoppingItem;
use App\Models\ShoppingItemAlias;
use App\Models\User;
use App\Services\Meal\IngredientImportService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Livewire\Livewire;
use Tests\TestCase;

class IngredientImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_both_meal_tabs_render_the_bulk_assistant(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/meals/ingredients')
            ->assertOk()
            ->assertSee('Agregar varios');

        $this->actingAs($user)->get('/meals/shopping')
            ->assertOk()
            ->assertSee('Agregar varios');
    }

    public function test_meal_dialogs_are_teleported_outside_the_module_header(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/meals/ingredients')->assertOk();

        $response->assertSee('x-teleport="body"', false)
            ->assertDontSee('<template x-if="assistantOpen">', false)
            ->assertDontSee('<template x-if="showDialog">', false);
    }

    public function test_parser_cleans_dictation_extracts_quantities_and_consolidates_terms(): void
    {
        $rows = app(IngredientImportService::class)->parse(
            "Bueno, necesito comprar huevos; 2 leches\n• pan\n- 3 huevos"
        );

        $this->assertSame(['huevos', 'leches', 'pan'], array_column($rows, 'normalized'));
        $this->assertSame(3, $rows[0]['quantity']);
        $this->assertSame(2, $rows[1]['quantity']);
        $this->assertNull($rows[2]['quantity']);
    }

    public function test_resolver_only_uses_normalized_exact_names_and_aliases(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $milk = ShoppingItem::create(['name' => 'Leche', 'status' => 'available']);
        $rice = ShoppingItem::create(['name' => 'Arroz blanco', 'status' => 'available']);
        $importer = app(IngredientImportService::class);

        $resolved = $importer->resolve($importer->parse('LÉCHE, arroz'));

        $this->assertSame('matched_name', $resolved[0]['status']);
        $this->assertSame($milk->id, $resolved[0]['item_id']);
        $this->assertSame('unresolved', $resolved[1]['status']);

        $importer->createAlias($rice, 'arroz');
        $resolved = $importer->resolve($importer->parse('arroz'));

        $this->assertSame('matched_alias', $resolved[0]['status']);
        $this->assertSame($rice->id, $resolved[0]['item_id']);
    }

    public function test_shopping_assistant_updates_matches_and_creates_missing_ingredients(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $milk = ShoppingItem::create([
            'name' => 'Leche',
            'status' => 'available',
            'to_buy' => 5,
            'next_purchase' => false,
        ]);
        app(IngredientImportService::class)->createAlias($milk, 'leches');

        Livewire::test(BulkIngredientAssistant::class, ['context' => 'shopping'])
            ->call('open')
            ->set('input', '2 leches, pan')
            ->call('analyze')
            ->assertSet('step', 2)
            ->assertSet('rows.0.status', 'matched_alias')
            ->assertSet('rows.1.status', 'unresolved')
            ->set('rows.1.action', 'create')
            ->set('rows.1.new_name', 'Pan')
            ->set('rows.1.category', 'panaderia')
            ->set('rows.1.unit', 'unidad')
            ->call('confirm')
            ->assertHasNoErrors()
            ->assertSet('result.found', 1)
            ->assertSet('result.created', 1)
            ->assertDispatched('ingredients-imported');

        $this->assertDatabaseHas('shopping_items', [
            'id' => $milk->id,
            'next_purchase' => true,
            'to_buy' => 2,
        ]);
        $this->assertDatabaseHas('shopping_items', [
            'name' => 'Pan',
            'category' => 'panaderia',
            'unit' => 'unidad',
            'next_purchase' => true,
            'to_buy' => 0,
        ]);
    }

    public function test_ingredient_context_does_not_add_created_items_to_shopping(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        Livewire::test(BulkIngredientAssistant::class, ['context' => 'ingredients'])
            ->call('open')
            ->set('input', '12 huevos')
            ->call('analyze')
            ->set('rows.0.action', 'create')
            ->set('rows.0.new_name', 'Huevos')
            ->set('rows.0.category', 'lacteos')
            ->set('rows.0.unit', 'unidad')
            ->call('confirm')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('shopping_items', [
            'name' => 'Huevos',
            'next_purchase' => false,
            'to_buy' => 0,
        ]);
    }

    public function test_linking_an_unknown_term_learns_the_alias_and_preserves_quantity_without_a_number(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $rice = ShoppingItem::create([
            'name' => 'Arroz blanco',
            'status' => 'available',
            'to_buy' => 4,
            'next_purchase' => false,
        ]);

        Livewire::test(BulkIngredientAssistant::class, ['context' => 'shopping'])
            ->call('open')
            ->set('input', 'arroz')
            ->call('analyze')
            ->set('rows.0.action', 'link')
            ->set('rows.0.link_item_id', $rice->id)
            ->call('confirm')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('shopping_item_aliases', [
            'shopping_item_id' => $rice->id,
            'alias' => 'arroz',
            'normalized_alias' => 'arroz',
        ]);
        $this->assertDatabaseHas('shopping_items', [
            'id' => $rice->id,
            'next_purchase' => true,
            'to_buy' => 4,
        ]);
    }

    public function test_alias_management_blocks_collisions_with_another_ingredient_name(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        ShoppingItem::create(['name' => 'Arroz', 'status' => 'available']);
        $riceMilk = ShoppingItem::create(['name' => 'Leche de arroz', 'status' => 'available']);

        Livewire::test(MealIngredients::class)
            ->call('openForm', $riceMilk->id)
            ->call('addAlias')
            ->set('aliases.0.alias', 'arroz')
            ->call('save')
            ->assertHasErrors('aliases');

        $this->assertDatabaseCount('shopping_item_aliases', 0);
    }

    public function test_aliases_can_be_added_and_removed_from_the_ingredient_form(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = ShoppingItem::create(['name' => 'Arroz blanco', 'status' => 'available']);

        Livewire::test(MealIngredients::class)
            ->call('openForm', $item->id)
            ->call('addAlias')
            ->set('aliases.0.alias', 'arroz')
            ->call('save')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('shopping_item_aliases', [
            'shopping_item_id' => $item->id,
            'normalized_alias' => 'arroz',
        ]);

        Livewire::test(MealIngredients::class)
            ->call('openForm', $item->id)
            ->assertSet('aliases.0.alias', 'arroz')
            ->assertSee('arroz')
            ->call('removeAlias', 0)
            ->call('save')
            ->assertHasNoErrors();

        $this->assertDatabaseCount('shopping_item_aliases', 0);
    }

    public function test_import_is_fully_rolled_back_when_a_later_row_is_invalid(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $importer = app(IngredientImportService::class);

        try {
            $importer->apply([
                [
                    'term' => 'Pan', 'normalized' => 'pan', 'quantity' => null,
                    'action' => 'create', 'new_name' => 'Pan', 'category' => 'panaderia', 'unit' => '',
                ],
                [
                    'term' => 'Leche', 'normalized' => 'leche', 'quantity' => null,
                    'action' => 'link', 'link_item_id' => (string) str()->uuid(),
                ],
            ], 'shopping');
            $this->fail('La importación debía fallar.');
        } catch (ValidationException) {
            $this->assertDatabaseMissing('shopping_items', ['name' => 'Pan']);
        }
    }

    public function test_aliases_cannot_cross_tenant_boundaries(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $otherItem = $other->shoppingItems()->create(['name' => 'Producto privado', 'status' => 'available']);
        $this->actingAs($owner);

        $this->expectException(QueryException::class);
        ShoppingItemAlias::create([
            'shopping_item_id' => $otherItem->id,
            'alias' => 'privado',
            'normalized_alias' => 'privado',
        ]);
    }
}
