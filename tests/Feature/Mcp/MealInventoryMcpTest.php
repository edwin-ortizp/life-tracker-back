<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Meal\ConsumeMealTool;
use App\Mcp\Tools\Meal\GenerateMealShoppingTool;
use App\Mcp\Tools\Meal\ListMealPlanTool;
use App\Mcp\Tools\Meal\ManageMealTool;
use App\Mcp\Tools\Meal\ManagePreparationTool;
use App\Mcp\Tools\Meal\PlanMealTool;
use App\Mcp\Tools\Meal\SuggestMealsTool;
use App\Models\MealPlanEntry;
use App\Models\MealPreparation;
use App\Models\Recipe;
use App\Models\ShoppingItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Testing\TestResponse;
use Tests\TestCase;

class MealInventoryMcpTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create();
        $this->actingAs($this->owner);
    }

    private function tool(string $class, array $data = []): TestResponse
    {
        return LifeTrackerServer::actingAs($this->owner)->tool($class, $data);
    }

    private function data(TestResponse $response): array
    {
        $response->assertOk();

        return (fn () => $this->structuredContent())->call($response);
    }

    private function fixture(): array
    {
        $product = ShoppingItem::create(['name' => 'Leche', 'base_unit' => 'ml', 'stock' => 1000, 'status' => 'available']);
        $recipe = Recipe::create(['name' => 'Sopa', 'servings' => 6, 'nutrition' => ['calories' => 100]]);
        $recipe->recipeIngredients()->create(['shopping_item_id' => $product->id, 'quantity' => 600, 'unit' => 'ml']);

        return [$product, $recipe];
    }

    public function test_plan_linked_items_consume_revert_and_query_contract(): void
    {
        [$product] = $this->fixture();
        $plan = $this->data($this->tool(PlanMealTool::class, ['meal_type' => 'cena', 'operation_key' => 'plan', 'items' => [['name' => 'Vaso de leche', 'calories' => 150,
            'ingredients' => [['shopping_item_id' => $product->id, 'quantity' => 250, 'unit' => 'ml']]]]]));
        $this->assertSame(1000.0, $product->fresh()->stock);
        $input = ['meal_id' => $plan['meal_id'], 'operation_key' => 'consume'];
        $consumed = $this->data($this->tool(ConsumeMealTool::class, $input));
        $this->assertSame($consumed, $this->data($this->tool(ConsumeMealTool::class, $input)));
        $this->assertSame(750.0, $product->fresh()->stock);
        $listed = $this->data($this->tool(ListMealPlanTool::class));
        $meal = $listed['days'][0]['meals'][0];
        $this->assertSame('consumed', $meal['status']);
        $this->assertSame(0, $listed['days'][0]['planned_calories']);
        $this->assertSame(150, $listed['days'][0]['consumed_calories']);
        $this->assertSame(['Vaso de leche (150 kcal)'], $meal['items']);
        $this->assertSame($product->id, $meal['components'][0]['ingredients'][0]['shopping_item_id']);
        $this->tool(ManageMealTool::class, ['action' => 'delete', 'meal_id' => $plan['meal_id'], 'operation_key' => 'delete'])->assertHasErrors();
        $this->tool(ConsumeMealTool::class, ['action' => 'revert', 'meal_id' => $plan['meal_id'], 'operation_key' => 'revert'])->assertOk();
        $this->assertSame(1000.0, $product->fresh()->stock);
    }

    public function test_preparations_cook_list_detail_consume_and_cancel_contracts(): void
    {
        [$product, $recipe] = $this->fixture();
        $input = ['action' => 'cook', 'recipe_id' => $recipe->id, 'portions' => 6, 'operation_key' => 'cook'];
        $cooked = $this->data($this->tool(ManagePreparationTool::class, $input));
        $this->assertSame($cooked, $this->data($this->tool(ManagePreparationTool::class, $input)));
        $prepId = $cooked['preparation_id'];
        $listed = $this->data($this->tool(ManagePreparationTool::class, ['action' => 'list']));
        $this->assertSame($prepId, $listed['preparations'][0]['id']);
        $this->assertSame(6, $listed['preparations'][0]['available']);
        $plan = $this->data($this->tool(PlanMealTool::class, ['meal_type' => 'cena', 'items' => [['preparation_id' => $prepId, 'portions' => 2]]]));
        $this->tool(ConsumeMealTool::class, ['meal_id' => $plan['meal_id'], 'operation_key' => 'eat'])->assertOk();
        $detail = $this->data($this->tool(ManagePreparationTool::class, ['action' => 'detail', 'preparation_id' => $prepId]));
        $this->assertSame(4, $detail['remaining']);
        $this->assertSame(400.0, $product->fresh()->stock);
        $this->tool(ManagePreparationTool::class, ['action' => 'cancel', 'preparation_id' => $prepId, 'operation_key' => 'cancel'])->assertHasErrors();
        $this->tool(ConsumeMealTool::class, ['action' => 'revert', 'meal_id' => $plan['meal_id'], 'operation_key' => 'undo'])->assertOk();
        $this->tool(ManageMealTool::class, ['action' => 'delete', 'meal_id' => $plan['meal_id'], 'operation_key' => 'delete'])->assertOk();
        $this->tool(ManagePreparationTool::class, ['action' => 'cancel', 'preparation_id' => $prepId, 'operation_key' => 'cancel'])->assertOk();
        $this->assertSame(1000.0, $product->fresh()->stock);
    }

    public function test_edit_move_copy_swap_and_outside_without_plan(): void
    {
        $plan = $this->data($this->tool(PlanMealTool::class, ['date' => '2026-10-05', 'meal_type' => 'cena', 'items' => [['name' => 'Sopa'], ['name' => 'Pan']]]));
        $entry = MealPlanEntry::find($plan['meal_id']);
        $items = $entry->items->map(fn ($item) => ['id' => $item->id, 'name' => $item->name === 'Sopa' ? 'Otra sopa' : $item->name])->all();
        $this->tool(ManageMealTool::class, ['action' => 'edit', 'meal_id' => $entry->id, 'items' => $items, 'operation_key' => 'edit'])->assertOk();
        $copy = $this->data($this->tool(ManageMealTool::class, ['action' => 'copy', 'meal_id' => $entry->id, 'date' => '2026-10-06', 'meal_type' => 'cena', 'operation_key' => 'copy']));
        $this->tool(ManageMealTool::class, ['action' => 'swap', 'meal_id' => $entry->id, 'date' => '2026-10-06', 'meal_type' => 'cena', 'operation_key' => 'swap'])->assertOk();
        $this->tool(ManageMealTool::class, ['action' => 'move', 'meal_id' => $entry->id, 'date' => '2026-10-07', 'meal_type' => 'cena', 'operation_key' => 'move'])->assertOk();
        $this->assertSame('2026-10-07', $entry->fresh()->date->toDateString());
        $this->assertCount(2, MealPlanEntry::find($copy['meal_id'])->items);
        $outside = $this->data($this->tool(ConsumeMealTool::class, ['mode' => 'outside', 'date' => '2026-10-05', 'meal_type' => 'almuerzo', 'operation_key' => 'outside']));
        $this->assertSame('outside', $outside['mode']);
        $this->assertDatabaseCount('meal_inventory_movements', 0);
    }

    public function test_suggestions_and_explicit_shopping_preview_generation(): void
    {
        [$product, $recipe] = $this->fixture();
        $product->update(['stock' => 50, 'consume_by' => today()->subDay()]);
        $variant = $product->variants()->create(['content' => 100]);
        $suggestions = $this->data($this->tool(SuggestMealsTool::class));
        $this->assertSame($product->id, $suggestions['expired_products'][0]['id']);
        $this->assertFalse($suggestions['recipes'][0]['can_cook']);
        $this->tool(PlanMealTool::class, ['meal_type' => 'cena', 'items' => [['recipe_id' => $recipe->id, 'portions' => 2]]])->assertOk();
        $preview = $this->data($this->tool(GenerateMealShoppingTool::class));
        $this->assertSame(150, $preview['needs'][0]['missing']);
        $input = ['action' => 'generate', 'variants' => [['shopping_item_id' => $product->id, 'variant_id' => $variant->id]], 'operation_key' => 'generate'];
        $this->tool(GenerateMealShoppingTool::class, ['action' => 'generate', 'operation_key' => 'no-variant'])->assertHasErrors();
        $first = $this->data($this->tool(GenerateMealShoppingTool::class, $input));
        $this->assertSame($first, $this->data($this->tool(GenerateMealShoppingTool::class, $input)));
        $this->assertSame(2.0, $product->fresh()->to_buy);
    }

    public function test_new_tools_reject_foreign_ids_and_invalid_units(): void
    {
        [$product, $recipe] = $this->fixture();
        $prepId = $this->data($this->tool(ManagePreparationTool::class, ['action' => 'cook', 'recipe_id' => $recipe->id, 'portions' => 1, 'operation_key' => 'cook']))['preparation_id'];
        $this->owner = User::factory()->create();
        $this->tool(ManagePreparationTool::class, ['action' => 'detail', 'preparation_id' => $prepId])->assertHasErrors();
        $this->tool(PlanMealTool::class, ['meal_type' => 'cena', 'items' => [['preparation_id' => $prepId]]])->assertHasErrors();
        $this->tool(PlanMealTool::class, ['meal_type' => 'cena', 'items' => [['name' => 'Ajeno', 'ingredients' => [['shopping_item_id' => $product->id, 'quantity' => 1]]]]])->assertHasErrors();
        $this->assertDatabaseCount('meal_preparations', 1);
        $this->assertDatabaseCount('meal_plan_entries', 0);
    }
}
