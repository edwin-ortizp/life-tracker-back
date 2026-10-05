<?php

namespace Tests\Feature\Meal;

use App\Livewire\Meal\MealProductCompare;
use App\Livewire\Meal\MealRecipes;
use App\Livewire\Meal\MealShopping;
use App\Livewire\Meal\StoreCatalog;
use App\Models\Recipe;
use App\Models\ShoppingItem;
use App\Models\ShoppingItemPrice;
use App\Models\Store;
use App\Models\User;
use App\Services\Meal\CatalogNames;
use App\Services\Meal\RecipeCalculator;
use App\Services\Meal\UnitConverter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class ComparablePricesTest extends TestCase
{
    use RefreshDatabase;

    private function product(string $name, string $baseUnit, array $attributes = []): ShoppingItem
    {
        return ShoppingItem::create(['name' => $name, 'base_unit' => $baseUnit, 'status' => 'available', ...$attributes]);
    }

    private function offer(ShoppingItem $product, ?float $content, float $amount, string $store = 'D1', array $variant = [], ?string $date = null): void
    {
        $product->variants()->create(['content' => $content, ...$variant])->prices()->create([
            'store_id' => Store::firstOrCreate(['name' => $store])->id,
            'amount' => $amount,
            'observed_on' => $date ?? now()->toDateString(),
            'source' => 'web',
        ]);
    }

    public function test_units_convert_to_the_base_unit(): void
    {
        $this->assertSame(500.0, UnitConverter::toBase(0.5, 'kg', 'g'));
        $this->assertSame(1000.0, UnitConverter::toBase(2, 'libras', 'g'));
        $this->assertSame(1500.0, UnitConverter::toBase(1.5, 'L', 'ml'));
        $this->assertSame(30.0, UnitConverter::toBase(1, 'cartón', 'unit'));
        $this->assertSame(360.0, UnitConverter::toBase(2, 'piezas', 'g', 180));
        $this->assertNull(UnitConverter::toBase(1, 'taza', 'g'));
        $this->assertSame([900.0, 'ml'], UnitConverter::parse('Aceite Imatá 900 ml'));
    }

    public function test_store_names_are_unified_and_similar_names_are_suggested(): void
    {
        $this->actingAs(User::factory()->create());

        $d1 = Store::create(['name' => 'D1']);
        $this->assertSame($d1->id, CatalogNames::findStore(' d1 ')->id);
        $this->assertNull(CatalogNames::findStore('Tiendas Ara'));
        $this->assertSame(['Atún en aceite'], CatalogNames::similar('Atun en aceite.', ['Atún en aceite', 'Arroz'])->all());
    }

    public function test_compare_view_reproduces_the_spec_example_and_flags_pending_variants(): void
    {
        $this->actingAs(User::factory()->create());
        $oats = $this->product('Avena en hojuelas', 'g');
        $this->offer($oats, 400, 4950, variant: ['brand_id' => CatalogNames::brand('Quaker')->id]);
        $this->offer($oats, 400, 2250, variant: ['brand_id' => CatalogNames::brand('Fit Graan')->id], date: now()->subDays(90)->toDateString());
        $oats->variants()->create(['brand_id' => CatalogNames::brand('Sin dato')->id]);

        Livewire::test(MealProductCompare::class, ['item' => $oats])
            ->assertViewHas('comparable', function ($offers) {
                return $offers->pluck('per_base')->map(fn ($value) => round($value, 2))->all() === [562.5, 1237.5]
                    && round($offers[1]['difference'], 1) === 120.0;
            })
            ->assertViewHas('pending', fn ($pending) => $pending->count() === 1)
            ->assertSee('Más barata')
            ->assertSee('Más de 60 días')
            ->assertSee('Pendientes de completar');
    }

    public function test_registering_a_ticket_price_marks_it_verified(): void
    {
        $this->actingAs(User::factory()->create());
        $milk = $this->product('Leche deslactosada', 'ml');
        $this->offer($milk, 900, 3200);

        Livewire::test(MealProductCompare::class, ['item' => $milk])
            ->call('openForm')
            ->set('priceStoreId', Store::create(['name' => 'Éxito'])->id)
            ->set('priceAmount', 3500)
            ->call('savePrice')
            ->assertHasNoErrors();

        $price = ShoppingItemPrice::where('source', 'ticket')->firstOrFail();
        $this->assertTrue($price->isVerified());
        $this->assertTrue($price->paid);
    }

    public function test_marking_as_purchased_adds_stock_and_records_the_paid_price(): void
    {
        $this->actingAs(User::factory()->create());
        $oil = $this->product('Aceite vegetal', 'ml', ['stock' => 100, 'to_buy' => 2, 'next_purchase' => true]);
        $this->offer($oil, 900, 6950);

        Livewire::test(MealShopping::class)
            ->call('openPurchase', $oil->id)
            ->assertSet('purchaseQuantity', 2.0)
            ->assertSet('purchaseStoreId', Store::where('name', 'D1')->value('id'))
            ->set('purchaseAmount', 6800)
            ->call('confirmPurchase')
            ->assertHasNoErrors();

        $oil->refresh();
        $this->assertSame(1900.0, $oil->stock);
        $this->assertFalse($oil->next_purchase);
        $this->assertDatabaseHas('shopping_item_prices', ['amount' => 6800, 'source' => 'ticket', 'paid' => true]);
    }

    public function test_recipe_cost_and_nutrition_are_calculated_from_ingredients(): void
    {
        $this->actingAs(User::factory()->create());
        $rice = $this->product('Arroz', 'g', ['kcal' => 360, 'protein' => 7, 'carbs' => 79, 'fat' => 1]);
        $this->offer($rice, 1000, 5000);
        $egg = $this->product('Huevo', 'unit', ['kcal' => 70, 'protein' => 6, 'carbs' => 0, 'fat' => 5]);
        $this->offer($egg, 30, 15000);

        Livewire::test(MealRecipes::class)
            ->call('openForm')
            ->set('name', 'Arroz con huevo')
            ->set('servings', 2)
            ->call('addIngredient')
            ->set('ingredients.0.name', 'Arroz')
            ->set('ingredients.0.quantity', 0.14)
            ->set('ingredients.0.unit', 'kg')
            ->call('addIngredient')
            ->set('ingredients.1.name', 'Huevo')
            ->set('ingredients.1.quantity', 2)
            ->call('save')
            ->assertHasNoErrors();

        $recipe = Recipe::firstOrFail();
        $this->assertDatabaseHas('recipe_ingredients', ['shopping_item_id' => $rice->id, 'quantity' => 140, 'unit' => 'g']);
        $this->assertSame('calculated', $recipe->nutrition_source);
        // (140 g × 3,6 + 2 × 70) / 2 porciones = 322 kcal.
        $this->assertSame(322, $recipe->nutrition['calories']);

        $result = app(RecipeCalculator::class)->calculate($recipe->fresh());
        // (140 × $5 + 2 × $500) / 2 = $850 por porción.
        $this->assertSame(850.0, $result['cost_per_serving']);
    }

    public function test_recipe_keeps_manual_nutrition_while_an_ingredient_lacks_data(): void
    {
        $this->actingAs(User::factory()->create());
        $this->product('Pollo', 'g');

        Livewire::test(MealRecipes::class)
            ->call('openForm')
            ->set('name', 'Pollo asado')
            ->set('nutritionCalories', 450)
            ->call('addIngredient')
            ->set('ingredients.0.name', 'Pollo')
            ->set('ingredients.0.quantity', 200)
            ->call('save')
            ->assertHasNoErrors();

        $recipe = Recipe::firstOrFail();
        $this->assertSame('manual', $recipe->nutrition_source);
        $this->assertEquals(450, $recipe->nutrition['calories']);
    }

    public function test_store_catalog_creates_rejects_similar_renames_and_merges(): void
    {
        $this->actingAs(User::factory()->create());
        $oil = $this->product('Aceite vegetal', 'ml');
        $this->offer($oil, 900, 6950, 'Éxito');

        Livewire::test(StoreCatalog::class)
            ->call('show')
            ->set('newName', 'exito')
            ->call('create')
            ->assertHasErrors('newName')
            ->set('newName', 'Éxito Popayán')
            ->call('create')
            ->assertHasErrors('newName')
            ->assertSet('confirmSimilar', true)
            ->call('create')
            ->assertHasNoErrors()
            ->assertDispatched('stores-updated');

        $duplicate = Store::where('name', 'Éxito Popayán')->first();
        Livewire::test(StoreCatalog::class)
            ->call('show')
            ->call('startRename', $duplicate->id)
            ->set('editingName', 'Exito Centro')
            ->call('rename')
            ->call('startMerge', Store::where('name', 'Éxito')->value('id'))
            ->set('mergeTargetId', $duplicate->id)
            ->call('merge')
            ->assertHasNoErrors();

        $this->assertSame(['Exito Centro'], Store::pluck('name')->all());
        $this->assertSame(1, $duplicate->prices()->count());
    }

    public function test_prices_only_accept_stores_from_the_catalog(): void
    {
        $this->actingAs(User::factory()->create());
        $milk = $this->product('Leche', 'ml');
        $this->offer($milk, 900, 3200);

        Livewire::test(MealProductCompare::class, ['item' => $milk])
            ->call('openForm')
            ->set('priceStoreId', 'no-existe')
            ->set('priceAmount', 3500)
            ->call('savePrice')
            ->assertHasErrors('priceStoreId');
    }
}
