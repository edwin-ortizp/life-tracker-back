<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Shopping\ManagePriceTool;
use App\Mcp\Tools\Shopping\MarkPurchasedTool;
use App\Mcp\Tools\Shopping\UpdateVariantTool;
use App\Models\ShoppingItem;
use App\Models\ShoppingItemPrice;
use App\Models\ShoppingItemVariant;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LifeTrackerCatalogMcpTest extends TestCase
{
    use RefreshDatabase;

    private function oil(User $user): array
    {
        $this->actingAs($user);
        $item = ShoppingItem::create(['name' => 'Aceite vegetal', 'base_unit' => 'ml', 'status' => 'available', 'stock' => 100, 'to_buy' => 2, 'next_purchase' => true]);
        $variant = $item->variants()->create([]);
        $price = $variant->prices()->create(['store_id' => Store::firstOrCreate(['name' => 'D1'])->id, 'amount' => 6950, 'observed_on' => '2026-10-04', 'source' => 'web']);

        return [$item, $variant, $price];
    }

    public function test_update_variant_tool_completes_a_pending_variant(): void
    {
        $user = User::factory()->create();
        [$item, $variant] = $this->oil($user);
        $other = $item->variants()->create(['is_preferred' => true]);

        LifeTrackerServer::actingAs($user)
            ->tool(UpdateVariantTool::class, [
                'variant_id' => $variant->id, 'brand' => 'Imatá', 'packaging' => 'botella',
                'content' => 0.9, 'content_unit' => 'L', 'is_preferred' => true,
            ])
            ->assertOk()
            ->assertSee('Imatá · Botella · 900 ml');

        $variant->refresh();
        $this->assertSame(900.0, $variant->content);
        $this->assertTrue($variant->is_preferred);
        $this->assertFalse($other->fresh()->is_preferred);
    }

    public function test_update_variant_tool_rejects_unconvertible_units_and_deletes(): void
    {
        $user = User::factory()->create();
        [, $variant] = $this->oil($user);

        LifeTrackerServer::actingAs($user)
            ->tool(UpdateVariantTool::class, ['variant_id' => $variant->id, 'content' => 1, 'content_unit' => 'kg'])
            ->assertHasErrors();

        LifeTrackerServer::actingAs($user)
            ->tool(UpdateVariantTool::class, ['variant_id' => $variant->id, 'delete' => true])
            ->assertOk();

        $this->assertSame(0, ShoppingItemVariant::count());
        $this->assertSame(0, ShoppingItemPrice::count());
    }

    public function test_manage_price_tool_verifies_updates_and_deletes(): void
    {
        $user = User::factory()->create();
        [, , $price] = $this->oil($user);

        Store::create(['name' => 'Éxito']);
        LifeTrackerServer::actingAs($user)->tool(ManagePriceTool::class, ['price_id' => $price->id, 'action' => 'verify'])->assertOk();
        $this->assertTrue($price->fresh()->isVerified());

        LifeTrackerServer::actingAs($user)
            ->tool(ManagePriceTool::class, ['price_id' => $price->id, 'action' => 'update', 'amount' => 7100, 'store' => 'Éxito', 'source' => 'ticket'])
            ->assertOk()
            ->assertSee('$7.100 en Éxito');

        LifeTrackerServer::actingAs($user)->tool(ManagePriceTool::class, ['price_id' => $price->id, 'action' => 'delete'])->assertOk();
        $this->assertSame(0, ShoppingItemPrice::count());
    }

    public function test_tools_do_not_touch_other_users_data(): void
    {
        [, $variant, $price] = $this->oil(User::factory()->create());
        $intruder = User::factory()->create();

        LifeTrackerServer::actingAs($intruder)->tool(ManagePriceTool::class, ['price_id' => $price->id, 'action' => 'delete'])->assertHasErrors();
        LifeTrackerServer::actingAs($intruder)->tool(UpdateVariantTool::class, ['variant_id' => $variant->id, 'delete' => true])->assertHasErrors();

        $this->assertSame(1, ShoppingItemPrice::withoutGlobalScopes()->count());
    }

    public function test_mark_purchased_tool_adds_stock_and_records_the_paid_price(): void
    {
        $user = User::factory()->create();
        [$item, $variant] = $this->oil($user);
        $variant->update(['content' => 900]);

        LifeTrackerServer::actingAs($user)
            ->tool(MarkPurchasedTool::class, ['name' => 'Aceite', 'amount_paid' => 6800, 'store' => 'D1'])
            ->assertOk()
            ->assertSee('+1,8 L');

        $item->refresh();
        $this->assertSame(1900.0, $item->stock);
        $this->assertFalse($item->next_purchase);
        $this->assertDatabaseHas('shopping_item_prices', ['amount' => 6800, 'source' => 'ticket', 'paid' => true]);
    }
}
