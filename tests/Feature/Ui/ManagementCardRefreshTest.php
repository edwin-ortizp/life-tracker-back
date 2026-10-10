<?php

namespace Tests\Feature\Ui;

use App\Livewire\Meal\MealIngredients;
use App\Models\ShoppingItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class ManagementCardRefreshTest extends TestCase
{
    use RefreshDatabase;

    public function test_refresh_reads_new_data_without_resetting_filters_page_or_draft(): void
    {
        $this->actingAs(User::factory()->create());
        foreach (range(1, 30) as $number) {
            ShoppingItem::create(['name' => sprintf('Producto %02d', $number), 'base_unit' => 'unit', 'category' => 'otros', 'status' => 'available']);
        }
        $item = ShoppingItem::where('name', 'Producto 30')->firstOrFail();
        $component = Livewire::test(MealIngredients::class)
            ->set('search', 'Producto')->set('categoryFilter', 'otros')->call('setPage', 2)
            ->call('openForm', $item->id)->set('name', 'Borrador sin guardar');

        ShoppingItem::whereKey($item->id)->update(['stock' => 42]);
        $component->call('$refresh')->assertSet('search', 'Producto')->assertSet('categoryFilter', 'otros')
            ->assertSet('paginators.page', 2)->assertSet('name', 'Borrador sin guardar')->assertSet('showForm', true)
            ->assertViewHas('ingredients', fn ($items) => $items->firstWhere('id', $item->id)?->stock === 42.0);
    }
}
