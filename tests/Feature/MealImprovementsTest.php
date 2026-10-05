<?php

namespace Tests\Feature;

use App\Livewire\Meal\MealIngredients;
use App\Livewire\Meal\MealShopping;
use App\Livewire\Meal\MealWeekly;
use App\Models\MealPlanEntry;
use App\Models\ShoppingItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class MealImprovementsTest extends TestCase
{
    use RefreshDatabase;

    private function item(string $name, array $prices = [], array $attributes = []): ShoppingItem
    {
        $item = ShoppingItem::create(['name' => $name, 'base_unit' => 'unit', 'stock' => 0, 'to_buy' => 1, 'status' => 'available', 'next_purchase' => true, ...$attributes]);
        foreach ($prices as $place => $price) {
            $variant = $item->variants()->create([]);
            if ($price !== null) {
                $variant->prices()->create(['store_id' => Store::firstOrCreate(['name' => $place])->id, 'amount' => $price, 'observed_on' => now()->toDateString(), 'source' => 'manual']);
            }
        }

        return $item;
    }

    public function test_shopping_total_uses_cheapest_price_times_quantity_and_counts_unpriced(): void
    {
        $this->actingAs(User::factory()->create());
        $this->item('Leche', ['D1' => 4000, 'Éxito' => 5000], ['to_buy' => 2]);
        $this->item('Pan', ['Éxito' => 3000]);
        $this->item('Sal');

        Livewire::test(MealShopping::class)
            ->assertViewHas('estimatedTotal', 11000.0)
            ->assertViewHas('unpricedCount', 1)
            ->set('placeFilter', Store::where('name', 'Éxito')->value('id'))
            ->assertViewHas('estimatedTotal', 13000.0)
            ->assertViewHas('unpricedCount', 0);
    }

    public function test_ingredients_can_be_filtered_by_store_price_and_cart(): void
    {
        $this->actingAs(User::factory()->create());
        $this->item('Leche', ['D1' => 4000]);
        $this->item('Pan', ['Éxito' => null], ['next_purchase' => false]);
        $this->item('Sal', [], ['next_purchase' => false]);

        $names = fn ($component) => $component->viewData('ingredients')->getCollection()->pluck('name')->sort()->values()->all();

        $c = Livewire::test(MealIngredients::class)->set('storeFilter', Store::where('name', 'D1')->value('id'));
        $this->assertSame(['Leche'], $names($c));
        $c->set('storeFilter', '__none');
        $this->assertSame(['Pan', 'Sal'], $names($c));
        $c->call('clearFilters')->set('priceFilter', 'without');
        $this->assertSame(['Pan', 'Sal'], $names($c));
        $c->call('clearFilters')->set('cartFilter', 'yes');
        $this->assertSame(['Leche'], $names($c));
    }

    public function test_weekly_plan_sums_calories_per_day(): void
    {
        $this->actingAs(User::factory()->create());
        $day = now()->startOfWeek();
        MealPlanEntry::create(['date' => $day, 'meal_type' => 'desayuno', 'calories' => 400]);
        MealPlanEntry::create(['date' => $day, 'meal_type' => 'comida', 'calories' => 700]);

        Livewire::test(MealWeekly::class)
            ->assertViewHas('dailyCalories', fn ($daily) => $daily->get($day->format('Y-m-d')) === 1100)
            ->assertSee('Total del día');
    }
}
