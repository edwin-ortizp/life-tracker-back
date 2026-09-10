<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Shopping\AddShoppingItemTool;
use App\Mcp\Tools\Shopping\ListShoppingItemsTool;
use App\Mcp\Tools\Shopping\RemoveShoppingItemTool;
use App\Mcp\Tools\Shopping\UpdateShoppingItemTool;
use App\Models\ShoppingItem;
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
            ->tool(AddShoppingItemTool::class, ['name' => 'Leche', 'quantity' => 2, 'unit' => 'litros'])
            ->assertOk()
            ->assertSee('Leche');

        $item = ShoppingItem::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('Leche', $item->name);
        $this->assertSame(2, $item->to_buy);
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
        $this->assertSame(1, $item->fresh()->to_buy);
    }

    public function test_add_shopping_item_tool_registers_a_store_price(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(AddShoppingItemTool::class, ['name' => 'Arroz', 'store' => 'Éxito', 'price' => 5000])
            ->assertOk();

        $item = ShoppingItem::where('user_id', $user->id)->firstOrFail();
        $this->assertDatabaseHas('shopping_item_variants', [
            'shopping_item_id' => $item->id,
            'place' => 'Éxito',
            'price' => 5000,
        ]);
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
            'name' => 'Café', 'stock' => 0, 'to_buy' => 1, 'status' => 'available', 'next_purchase' => true,
        ]);

        LifeTrackerServer::actingAs($user)
            ->tool(UpdateShoppingItemTool::class, [
                'item_id' => $item->id,
                'quantity' => 3,
                'store' => 'D1',
                'price' => 12000,
            ])
            ->assertOk();

        $this->assertSame(3, $item->fresh()->to_buy);
        $this->assertDatabaseHas('shopping_item_variants', [
            'shopping_item_id' => $item->id,
            'place' => 'D1',
            'price' => 12000,
        ]);
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
}
