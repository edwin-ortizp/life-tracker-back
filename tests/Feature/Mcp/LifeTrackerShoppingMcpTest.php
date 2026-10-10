<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Shopping\AddShoppingItemTool;
use App\Mcp\Tools\Shopping\CompareProductPricesTool;
use App\Mcp\Tools\Shopping\ListShoppingItemsTool;
use App\Mcp\Tools\Shopping\ManageStoreTool;
use App\Mcp\Tools\Shopping\RemoveShoppingItemTool;
use App\Mcp\Tools\Shopping\UpdateShoppingItemTool;
use App\Models\ShoppingItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LifeTrackerShoppingMcpTest extends TestCase
{
    use RefreshDatabase;

    public function test_add_shopping_item_tool_creates_a_new_item(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(AddShoppingItemTool::class, ['name' => 'Leche', 'quantity' => 2, 'base_unit' => 'litros'])
            ->assertOk()
            ->assertSee('Leche');

        $item = ShoppingItem::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('Leche', $item->name);
        $this->assertSame('ml', $item->base_unit);
        $this->assertSame(2.0, $item->to_buy);
        $this->assertTrue($item->next_purchase);
    }

    public function test_add_shopping_item_tool_reuses_an_existing_item_instead_of_duplicating(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = $user->shoppingItems()->create([
            'name' => 'Huevos', 'stock' => 0, 'to_buy' => 0, 'status' => 'available', 'next_purchase' => false,
        ]);

        LifeTrackerServer::actingAs($user)
            ->tool(AddShoppingItemTool::class, ['name' => 'Huevos', 'quantity' => 1])
            ->assertOk();

        $this->assertSame(1, ShoppingItem::where('user_id', $user->id)->count());
        $this->assertTrue($item->fresh()->next_purchase);
        $this->assertSame(1.0, $item->fresh()->to_buy);
    }

    public function test_add_shopping_item_tool_registers_a_store_price(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        Store::create(['name' => 'Éxito']);

        LifeTrackerServer::actingAs($user)
            ->tool(AddShoppingItemTool::class, [
                'name' => 'Arroz', 'base_unit' => 'g', 'brand' => 'Diana', 'content' => 1, 'content_unit' => 'kg',
                'store' => 'Éxito', 'price' => 5000, 'source' => 'web',
            ])
            ->assertOk();

        $item = ShoppingItem::withOffers()->where('user_id', $user->id)->firstOrFail();
        $offer = $item->bestOffer();
        $this->assertSame(1000.0, $offer['variant']->content);
        $this->assertSame('Diana', $offer['variant']->brand->name);
        $this->assertSame('Éxito', $offer['price']->store->name);
        $this->assertSame('web', $offer['price']->source);
        $this->assertFalse($offer['price']->isVerified());
        $this->assertSame(500.0, $offer['per_base']);
    }

    public function test_add_shopping_item_tool_requires_a_base_unit_for_new_products(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(AddShoppingItemTool::class, ['name' => 'Arroz'])
            ->assertHasErrors();

        $this->assertSame(0, ShoppingItem::where('user_id', $user->id)->count());
    }

    public function test_remove_shopping_item_tool_takes_it_off_the_list_without_deleting_it(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = $user->shoppingItems()->create([
            'name' => 'Pan', 'stock' => 0, 'to_buy' => 1, 'status' => 'available', 'next_purchase' => true,
        ]);

        LifeTrackerServer::actingAs($user)
            ->tool(RemoveShoppingItemTool::class, ['item_id' => $item->id])
            ->assertOk();

        $fresh = $item->fresh();
        $this->assertFalse($fresh->next_purchase);
        $this->assertNotNull($fresh);
    }

    public function test_update_shopping_item_tool_updates_quantity_and_price(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = $user->shoppingItems()->create([
            'name' => 'Café', 'base_unit' => 'g', 'stock' => 0, 'to_buy' => 1, 'status' => 'available', 'next_purchase' => true,
        ]);

        Store::create(['name' => 'D1']);

        LifeTrackerServer::actingAs($user)
            ->tool(UpdateShoppingItemTool::class, [
                'item_id' => $item->id,
                'quantity' => 3,
                'store' => 'D1',
                'price' => 12000,
            ])
            ->assertOk();

        $this->assertSame(3.0, $item->fresh()->to_buy);
        $this->assertSame(12000.0, ShoppingItem::withOffers()->find($item->id)->estimatedPrice());
    }

    public function test_update_shopping_item_tool_changes_base_unit_with_explicit_corrected_values(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = $user->shoppingItems()->create([
            'name' => 'Huevos', 'base_unit' => 'g', 'stock' => 600, 'min_stock' => 300,
            'kcal' => 150, 'to_buy' => 2, 'status' => 'available',
        ]);

        LifeTrackerServer::actingAs($user)->tool(UpdateShoppingItemTool::class, [
            'item_id' => $item->id, 'base_unit' => 'unit', 'stock' => 12, 'min_stock' => 6, 'kcal' => 75,
        ])->assertOk();

        $item->refresh();
        $this->assertSame('unit', $item->base_unit);
        $this->assertSame(12.0, $item->stock);
        $this->assertSame(6.0, $item->min_stock);
        $this->assertSame(75.0, $item->kcal);
        $this->assertSame(2.0, $item->to_buy);
    }

    public function test_update_shopping_item_tool_preserves_omitted_values_when_correcting_base_unit(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = $user->shoppingItems()->create([
            'name' => 'Leche', 'base_unit' => 'g', 'stock' => 500, 'min_stock' => 100, 'status' => 'available',
        ]);
        $variant = $item->variants()->create(['content' => 500]);

        LifeTrackerServer::actingAs($user)->tool(UpdateShoppingItemTool::class, [
            'item_id' => $item->id, 'base_unit' => 'ml',
        ])->assertOk();

        $this->assertSame('ml', $item->fresh()->base_unit);
        $this->assertSame(500.0, $item->fresh()->stock);
        $this->assertSame(100.0, $item->fresh()->min_stock);
        $this->assertSame(500.0, $variant->fresh()->content);
    }

    public function test_update_shopping_item_tool_rejects_invalid_or_foreign_base_unit_changes(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = $user->shoppingItems()->create([
            'name' => 'Arroz', 'base_unit' => 'g', 'stock' => 500, 'status' => 'available',
        ]);

        LifeTrackerServer::actingAs($user)->tool(UpdateShoppingItemTool::class, [
            'item_id' => $item->id, 'base_unit' => 'desconocida', 'stock' => 1,
        ])->assertHasErrors();

        LifeTrackerServer::actingAs(User::factory()->create())->tool(UpdateShoppingItemTool::class, [
            'item_id' => $item->id, 'base_unit' => 'ml',
        ])->assertHasErrors();

        $this->assertSame('g', $item->fresh()->base_unit);
        $this->assertSame(500.0, $item->fresh()->stock);
    }

    public function test_compare_tool_orders_variants_by_price_per_base_unit(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = $user->shoppingItems()->create(['name' => 'Aceite vegetal', 'base_unit' => 'ml', 'status' => 'available']);
        $d1 = Store::create(['name' => 'D1']);
        foreach ([[900, 6950], [3000, 20500]] as [$content, $amount]) {
            $item->variants()->create(['content' => $content])->prices()->create([
                'store_id' => $d1->id, 'amount' => $amount, 'observed_on' => now()->toDateString(), 'source' => 'web',
            ]);
        }
        $item->variants()->create([]);

        LifeTrackerServer::actingAs($user)
            ->tool(CompareProductPricesTool::class, ['name' => 'Aceite vegetal'])
            ->assertOk()
            ->assertSee('6833.33')
            ->assertSee('7722.22')
            ->assertSee('Sin presentación');
    }

    public function test_list_shopping_items_tool_only_returns_the_authenticated_users_pending_items(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $this->actingAs($owner);
        $owner->shoppingItems()->create(['name' => 'Mío', 'stock' => 0, 'to_buy' => 1, 'status' => 'available', 'next_purchase' => true]);
        $this->actingAs($otherUser);
        $otherUser->shoppingItems()->create(['name' => 'Ajeno', 'stock' => 0, 'to_buy' => 1, 'status' => 'available', 'next_purchase' => true]);

        LifeTrackerServer::actingAs($owner)
            ->tool(ListShoppingItemsTool::class, [])
            ->assertOk()
            ->assertSee('Mío')
            ->assertDontSee('Ajeno');
    }

    public function test_price_tools_reject_unknown_stores_without_creating_anything(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        Store::create(['name' => 'Éxito']);

        LifeTrackerServer::actingAs($user)
            ->tool(AddShoppingItemTool::class, ['name' => 'Arroz', 'base_unit' => 'g', 'store' => 'Exito Popayan', 'price' => 5000])
            ->assertHasErrors(['Éxito']);

        $this->assertSame(0, ShoppingItem::count());
        $this->assertSame(1, Store::count());
    }

    public function test_manage_store_tool_lists_creates_and_merges(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = $user->shoppingItems()->create(['name' => 'Pan', 'base_unit' => 'unit', 'status' => 'available']);
        $old = Store::create(['name' => 'Tiendas D1']);
        $item->variants()->create([])->prices()->create(['store_id' => $old->id, 'amount' => 2000, 'observed_on' => '2026-10-01', 'source' => 'manual']);

        LifeTrackerServer::actingAs($user)->tool(ManageStoreTool::class, ['action' => 'create', 'new_name' => 'D1'])->assertHasErrors();
        LifeTrackerServer::actingAs($user)->tool(ManageStoreTool::class, ['action' => 'create', 'new_name' => 'D1', 'confirm_similar' => true])->assertOk();
        LifeTrackerServer::actingAs($user)->tool(ManageStoreTool::class, ['action' => 'merge', 'store' => 'Tiendas D1', 'into' => 'D1'])->assertOk()->assertSee('1 precios movidos');
        LifeTrackerServer::actingAs($user)->tool(ManageStoreTool::class, ['action' => 'list'])
            ->assertOk()
            ->assertStructuredContent(['stores' => [['id' => Store::where('name', 'D1')->firstOrFail()->id, 'name' => 'D1', 'prices' => 1]]]);

        $this->assertSame(['D1'], Store::pluck('name')->all());
    }
}
