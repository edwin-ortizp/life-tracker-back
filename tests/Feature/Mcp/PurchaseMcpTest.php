<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Shopping\CreatePurchaseTool;
use App\Mcp\Tools\Shopping\GetPurchaseTool;
use App\Mcp\Tools\Shopping\ListPurchasesTool;
use App\Mcp\Tools\Shopping\ListShoppingItemsTool;
use App\Mcp\Tools\Shopping\MarkPurchasedTool;
use App\Mcp\Tools\Shopping\UpdatePurchaseTool;
use App\Models\Purchase;
use App\Models\ShoppingItem;
use App\Models\Store;
use App\Models\User;
use App\Services\Meal\PurchaseRecorder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\JsonSchema\JsonSchemaTypeFactory;
use Illuminate\Support\Str;
use Tests\TestCase;

class PurchaseMcpTest extends TestCase
{
    use RefreshDatabase;

    public function test_purchase_tools_create_retry_get_list_and_edit(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = ShoppingItem::create(['name' => 'Pan', 'base_unit' => 'unit', 'status' => 'available', 'stock' => 0]);
        $variant = $item->variants()->create(['content' => 5]);
        $store = Store::create(['name' => 'D1']);
        $input = ['store_id' => $store->id, 'purchased_at' => now()->toDateTimeString(), 'operation_key' => (string) Str::uuid(), 'lines' => [['shopping_item_id' => $item->id, 'shopping_item_variant_id' => $variant->id, 'packages' => 2, 'unit_price' => 3]]];
        LifeTrackerServer::actingAs($user)->tool(CreatePurchaseTool::class, $input)->assertOk()->assertSee('Pan');
        LifeTrackerServer::actingAs($user)->tool(CreatePurchaseTool::class, $input)->assertOk();
        $this->assertSame(1, Purchase::count());
        $purchase = Purchase::with('lines')->firstOrFail();
        LifeTrackerServer::actingAs($user)->tool(GetPurchaseTool::class, ['purchase_id' => $purchase->id])->assertOk()->assertSee($purchase->lines->first()->id);
        LifeTrackerServer::actingAs($user)->tool(ListPurchasesTool::class, ['item_id' => $item->id, 'store_id' => $store->id, 'to' => now()->toDateString()])->assertOk()->assertSee($purchase->id);
        $input['purchase_id'] = $purchase->id;
        $input['lines'][0]['id'] = $purchase->lines->first()->id;
        $input['lines'][0]['packages'] = 3;
        LifeTrackerServer::actingAs($user)->tool(UpdatePurchaseTool::class, $input)->assertOk();
        $this->assertSame(15.0, $item->fresh()->stock);
        LifeTrackerServer::actingAs($user)->tool(ListShoppingItemsTool::class, ['only_pending' => false])->assertOk()->assertSee('last_purchase')->assertSee($purchase->id);
        LifeTrackerServer::actingAs($user)->tool(ListShoppingItemsTool::class, ['only_pending' => false, 'not_purchased_days' => 60])->assertOk()->assertDontSee($item->id);
    }

    public function test_quick_purchase_keeps_contract_and_returns_history_id(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $item = ShoppingItem::create(['name' => 'Huevos', 'base_unit' => 'unit', 'status' => 'available', 'stock' => 0]);
        $key = (string) Str::uuid();
        LifeTrackerServer::actingAs($user)->tool(MarkPurchasedTool::class, ['item_id' => $item->id, 'packages' => 2, 'operation_key' => $key])->assertOk()->assertSee(Purchase::firstOrFail()->id);
        LifeTrackerServer::actingAs($user)->tool(MarkPurchasedTool::class, ['item_id' => $item->id, 'packages' => 2, 'operation_key' => $key])->assertOk();
        $this->assertSame(2.0, $item->fresh()->stock);
    }

    public function test_other_users_history_is_not_exposed_and_unknown_products_are_distinguished(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner);
        $item = ShoppingItem::create(['name' => 'Privado', 'base_unit' => 'unit', 'status' => 'available', 'stock' => 0]);
        $purchase = app(PurchaseRecorder::class)->record($item, null, 1)['purchase'];
        $other = User::factory()->create();
        $this->actingAs($other);
        ShoppingItem::create(['name' => 'Nunca comprado', 'base_unit' => 'unit', 'status' => 'available']);
        LifeTrackerServer::actingAs($other)->tool(ListPurchasesTool::class, [])->assertOk()->assertDontSee($purchase->id);
        LifeTrackerServer::actingAs($other)->tool(ListShoppingItemsTool::class, ['only_pending' => false, 'not_purchased_days' => 60])->assertOk()->assertSee('Nunca comprado')->assertSee('never_purchased')->assertDontSee('Privado');
    }

    public function test_new_tool_schemas_expose_nested_line_contracts(): void
    {
        $schema = new JsonSchemaTypeFactory;
        $this->assertArrayHasKey('lines', (new CreatePurchaseTool)->schema($schema));
        $this->assertArrayHasKey('purchase_id', (new UpdatePurchaseTool)->schema($schema));
    }
}
