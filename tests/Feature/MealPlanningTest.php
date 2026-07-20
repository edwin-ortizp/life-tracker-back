<?php

namespace Tests\Feature;

use App\Livewire\Meal\MealIngredients;
use App\Livewire\Meal\MealRecipes;
use App\Livewire\Meal\MealShopping;
use App\Livewire\Meal\MealWeekly;
use App\Models\MealPlanEntry;
use App\Models\Recipe;
use App\Models\ShoppingItem;
use App\Models\ShoppingItemVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\QueryException;
use Livewire\Livewire;
use Tests\TestCase;

class MealPlanningTest extends TestCase
{
    use RefreshDatabase;

    public function test_recipe_requires_a_positive_quantity_for_each_ingredient(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        Livewire::test(MealRecipes::class)
            ->call('openForm')
            ->set('name', 'Sopa de tomate')
            ->call('addIngredient')
            ->set('ingredients.0.name', 'Tomate')
            ->call('save')
            ->assertHasErrors(['ingredients.0.quantity' => 'required'])
            ->assertSee('La cantidad es obligatoria.')
            ->assertSet('showForm', true);

        $this->assertDatabaseCount('recipes', 0);
        $this->assertDatabaseCount('recipe_ingredients', 0);
    }

    public function test_a_meal_can_combine_recipes_and_custom_items_with_calculated_calories(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $recipe = Recipe::create([
            'name' => 'Huevos con tomate',
            'meal_type' => 'desayuno',
            'nutrition' => ['calories' => 300],
        ]);

        Livewire::test(MealWeekly::class)
            ->call('openForm', '2026-07-20', 'desayuno')
            ->call('addRecipe', $recipe->id)
            ->set('formItems.0.portions', 2)
            ->call('addCustomItem')
            ->set('formItems.1.name', 'Café con leche')
            ->set('formItems.1.calories', 50)
            ->call('save')
            ->assertHasNoErrors();

        $entry = MealPlanEntry::with('items.recipe')->firstOrFail();
        $this->assertCount(2, $entry->items);
        $this->assertSame(650, $entry->effective_calories);
        $this->assertDatabaseHas('meal_plan_entry_items', [
            'meal_plan_entry_id' => $entry->id,
            'recipe_id' => $recipe->id,
            'portions' => 2,
        ]);
        $this->assertDatabaseHas('meal_plan_entry_items', [
            'meal_plan_entry_id' => $entry->id,
            'recipe_id' => null,
            'name' => 'Café con leche',
            'calories' => 50,
        ]);
    }

    public function test_recipe_search_excludes_selected_and_other_users_recipes(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $this->actingAs($user);
        $selected = Recipe::create(['name' => 'Arepa de casa', 'meal_type' => 'desayuno']);
        $available = Recipe::create(['name' => 'Arepa con huevo', 'meal_type' => 'desayuno', 'favorite' => true]);
        Recipe::withoutEvents(function () use ($otherUser) {
            (new Recipe())->forceFill([
                'id' => (string) str()->uuid(),
                'user_id' => $otherUser->id,
                'name' => 'Arepa privada',
                'meal_type' => 'desayuno',
            ])->save();
        });

        Livewire::test(MealWeekly::class)
            ->call('openForm', '2026-07-20', 'desayuno')
            ->call('addRecipe', $selected->id)
            ->set('recipeSearch', 'Arepa')
            ->assertSee($available->name)
            ->assertDontSeeHtml('recipe-result-'.$selected->id)
            ->assertDontSee('Arepa privada');
    }

    public function test_shopping_requirements_include_all_recipes_and_multiply_portions(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $ingredient = ShoppingItem::create(['name' => 'Tomate', 'status' => 'available', 'stock' => 0, 'to_buy' => 0]);
        $recipe = Recipe::create(['name' => 'Salsa', 'meal_type' => 'comida']);
        $recipe->recipeIngredients()->create([
            'shopping_item_id' => $ingredient->id,
            'quantity' => 2,
            'unit' => 'kg',
        ]);
        $entry = MealPlanEntry::create(['date' => now()->startOfWeek(), 'meal_type' => 'comida']);
        $entry->items()->create(['recipe_id' => $recipe->id, 'portions' => 2.5, 'position' => 0]);

        Livewire::test(MealShopping::class)
            ->assertViewHas('neededItems', function ($items) use ($ingredient) {
                $needed = $items->first();

                return $needed['shopping_item_id'] === $ingredient->id
                    && $needed['quantity'] === 5.0
                    && $needed['unit'] === 'kg';
            });
    }

    public function test_existing_store_variants_load_and_are_updated_without_recreating_them(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $ingredient = ShoppingItem::create(['name' => 'Arroz', 'status' => 'available', 'stock' => 0, 'to_buy' => 0]);
        $variant = $ingredient->variants()->create(['place' => 'D1', 'price' => 4500]);

        Livewire::test(MealIngredients::class)
            ->call('openForm', $ingredient->id)
            ->assertSet('variants.0.id', $variant->id)
            ->assertSet('variants.0.place', 'D1')
            ->set('variants.0.price', 4700)
            ->call('addVariant')
            ->set('variants.1.place', 'Éxito')
            ->set('variants.1.price', 5200)
            ->call('save')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('shopping_item_variants', ['id' => $variant->id, 'price' => 4700]);
        $this->assertSame(2, ShoppingItemVariant::count());
    }

    public function test_manual_calorie_override_can_be_reset_to_the_component_calculation(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $recipe = Recipe::create(['name' => 'Avena', 'meal_type' => 'desayuno', 'nutrition' => ['calories' => 200]]);

        Livewire::test(MealWeekly::class)
            ->call('openForm', '2026-07-20', 'desayuno')
            ->call('addRecipe', $recipe->id)
            ->set('formCalories', 275)
            ->call('useCalculatedCalories')
            ->assertSet('formCalories', null)
            ->call('save');

        $entry = MealPlanEntry::with('items.recipe')->firstOrFail();
        $this->assertNull($entry->calories);
        $this->assertSame(200, $entry->effective_calories);
    }

    public function test_meal_components_cannot_link_another_users_entry_or_recipe(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $ownerEntry = $owner->mealPlanEntries()->create(['date' => '2026-07-20', 'meal_type' => 'cena']);
        $otherRecipe = $other->recipes()->create(['name' => 'Receta ajena', 'meal_type' => 'cena']);
        $this->actingAs($other);

        $this->expectException(QueryException::class);
        $ownerEntry->items()->create([
            'recipe_id' => $otherRecipe->id,
            'portions' => 1,
            'position' => 0,
        ]);
    }
}
