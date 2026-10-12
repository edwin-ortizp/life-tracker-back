<?php

namespace Tests\Feature\Meal;

use App\Livewire\Meal\MealSuggestions;
use App\Livewire\Meal\MealWeekly;
use App\Models\MealPlanEntry;
use App\Models\MealPlanEntryItem;
use App\Models\Recipe;
use App\Models\ShoppingItem;
use App\Models\User;
use App\Services\Meal\MealInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class MealScreensRedesignTest extends TestCase
{
    use RefreshDatabase;

    public function test_cook_table_filters_by_availability_and_search_and_opens_the_detail(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $soup = Recipe::create(['name' => 'Sopa sin ingredientes', 'meal_type' => 'almuerzo', 'prep_time' => 20]);

        $component = Livewire::test(MealSuggestions::class)->assertSet('availability', 'ready');
        $this->assertCount(0, $component->viewData('recipes'));

        $component->set('availability', 'incomplete');
        $this->assertSame(['Sopa sin ingredientes'], collect($component->viewData('recipes')->items())->pluck('name')->all());
        $component->assertSee('20 min');

        $component->set('search', 'pizza');
        $this->assertCount(0, $component->viewData('recipes'));

        $component->set('search', '')->set('availability', 'bogus')->assertSet('availability', 'ready');

        $component->set('availability', 'all')->call('showDetail', $soup->id)
            ->assertSee('no tiene ingredientes enlazados')
            ->call('closeDetail')->assertSet('detailId', null);
    }

    public function test_slot_menu_moves_a_planned_meal_to_another_day(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $saved = app(MealInventory::class)->plan($user->id, ['date' => today()->toDateString(), 'meal_type' => 'cena', 'mode' => 'replace',
            'items' => [['recipe_id' => null, 'name' => 'Arepa con queso', 'calories' => 300]]], 'test-plan');
        $target = today()->addDay()->toDateString();

        Livewire::test(MealWeekly::class)
            ->assertSee('Arepa con queso')
            ->call('openAction', $saved['meal_id'], 'move')
            ->assertSet('actionOpen', true)
            ->set('targetDate', $target)
            ->set('targetMealType', 'almuerzo')
            ->call('runAction')
            ->assertHasNoErrors()
            ->assertSet('actionOpen', false);

        $entry = MealPlanEntry::where('user_id', $user->id)->sole();
        $this->assertSame($target, $entry->date->toDateString());
        $this->assertSame('almuerzo', $entry->meal_type);
    }

    public function test_composer_rows_save_and_reopen_each_kind(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $rice = ShoppingItem::create(['name' => 'Arroz', 'base_unit' => 'g', 'status' => 'available', 'stock' => 1000, 'to_buy' => 0]);
        $date = today()->toDateString();

        Livewire::test(MealWeekly::class)
            ->call('openForm', $date, 'almuerzo')
            ->call('addRow')
            ->set('formItems.0.kind', 'ingredient')
            ->set('formItems.0.product_id', $rice->id)
            ->assertSet('formItems.0.unit', 'g')
            ->set('formItems.0.quantity', 1)
            ->set('formItems.0.unit', 'kg')
            ->call('addRow')
            ->set('formItems.1.kind', 'free')
            ->set('formItems.1.name', 'Jugo de mora')
            ->set('formItems.1.calories', 120)
            ->call('save')
            ->assertHasNoErrors()
            ->call('openForm', $date, 'almuerzo')
            ->assertSet('formItems.0.kind', 'ingredient')
            ->assertSet('formItems.0.product_id', $rice->id)
            ->assertSet('formItems.0.quantity', 1000)
            ->assertSet('formItems.1.kind', 'free')
            ->assertSet('formItems.1.calories', 120);

        $this->assertSame([$rice->id], collect(MealPlanEntryItem::where('name', 'Arroz')->sole()->ingredients)->pluck('shopping_item_id')->all());
    }

    public function test_legacy_free_item_keeps_all_its_linked_ingredients(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $milk = ShoppingItem::create(['name' => 'Leche', 'base_unit' => 'ml', 'status' => 'available', 'stock' => 1000, 'to_buy' => 0]);
        $oats = ShoppingItem::create(['name' => 'Avena', 'base_unit' => 'g', 'status' => 'available', 'stock' => 500, 'to_buy' => 0]);
        $date = today()->toDateString();
        app(MealInventory::class)->plan($user->id, ['date' => $date, 'meal_type' => 'desayuno', 'mode' => 'replace', 'items' => [[
            'name' => 'Avena con leche', 'ingredients' => [['shopping_item_id' => $milk->id, 'quantity' => 200, 'unit' => 'ml'], ['shopping_item_id' => $oats->id, 'quantity' => 40, 'unit' => 'g']],
        ]]], 'legacy');

        Livewire::test(MealWeekly::class)
            ->call('openForm', $date, 'desayuno')
            ->assertSet('formItems.0.kind', 'free')
            ->assertSee('2 ingredientes enlazados')
            ->call('save')
            ->assertHasNoErrors();

        $this->assertCount(2, MealPlanEntryItem::where('name', 'Avena con leche')->sole()->ingredients);
    }

    public function test_a_row_without_kind_cannot_be_saved(): void
    {
        $this->actingAs(User::factory()->create());

        Livewire::test(MealWeekly::class)
            ->call('openForm', today()->toDateString(), 'cena')
            ->call('addRow')
            ->call('save')
            ->assertHasErrors(['formItems.0.kind']);
    }

    public function test_today_card_only_shows_on_the_current_week(): void
    {
        $this->actingAs(User::factory()->create());

        Livewire::test(MealWeekly::class)
            ->assertSee('Hoy · ')
            ->call('nextWeek')
            ->assertDontSee('Hoy · ');
    }
}
