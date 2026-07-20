<?php

namespace App\Livewire\Meal;

use App\Models\MealPlanEntryItem;
use App\Models\ShoppingItem;
use App\Models\ShoppingItemVariant;
use Carbon\Carbon;
use Livewire\Attributes\Layout;
use Livewire\Attributes\On;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Compras')]
class MealShopping extends Component
{
    #[Url(as: 'q', history: true, keep: true)]
    public string $search = '';

    #[Url(as: 'place', history: true, keep: true)]
    public string $placeFilter = '';

    #[Url(as: 'group', history: true, keep: true)]
    public string $groupBy = 'category'; // 'category' or 'place'

    #[Url(as: 'view', history: true, keep: true)]
    public string $viewMode = 'compact'; // 'compact' or 'grouped'

    public array $categoryOptions = [
        'frutas_verduras' => 'Frutas y verduras',
        'carnes' => 'Carnes y pescados',
        'lacteos' => 'Lácteos y huevos',
        'panaderia' => 'Panadería',
        'cereales' => 'Cereales y granos',
        'enlatados' => 'Enlatados y conservas',
        'condimentos' => 'Condimentos y salsas',
        'bebidas' => 'Bebidas',
        'congelados' => 'Congelados',
        'snacks' => 'Snacks y dulces',
        'limpieza' => 'Limpieza',
        'higiene' => 'Higiene personal',
        'mascotas' => 'Mascotas',
        'otros' => 'Otros',
    ];

    public function mount(): void
    {
        $this->normalizeViewOptions();
    }

    public function setViewMode(string $mode): void
    {
        $this->viewMode = $mode;
        $this->normalizeViewOptions();
    }

    public function toggleGroupBy()
    {
        $this->groupBy = $this->groupBy === 'category' ? 'place' : 'category';
    }

    public function toggleNextPurchase(string $id)
    {
        $item = ShoppingItem::find($id);
        if ($item) {
            $item->update(['next_purchase' => ! $item->next_purchase]);
        }
    }

    #[On('ingredients-imported')]
    public function refreshIngredients(): void
    {
        // The event is enough to trigger a fresh render of the shopping list.
    }

    private function normalizeViewOptions(): void
    {
        if (! in_array($this->viewMode, ['compact', 'grouped'], true)) {
            $this->viewMode = 'compact';
        }

        if (! in_array($this->groupBy, ['category', 'place'], true)) {
            $this->groupBy = 'category';
        }
    }

    public function render()
    {
        $query = ShoppingItem::query()
            ->with('variants')
            ->where('next_purchase', true)
            ->when($this->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($this->placeFilter, fn ($q, $p) => $q->whereHas('variants', fn ($vq) => $vq->where('place', $p)))
            ->orderBy('name');

        $items = $query->get();

        if ($this->groupBy === 'place') {
            $grouped = collect();
            foreach ($items as $item) {
                $places = $item->variants->pluck('place')->filter()->unique();
                if ($places->isEmpty()) {
                    $grouped->push(['group' => null, 'item' => $item]);
                } else {
                    foreach ($places as $place) {
                        $grouped->push(['group' => $place, 'item' => $item]);
                    }
                }
            }
            $grouped = $grouped->groupBy('group')->map(fn ($g) => $g->pluck('item')->unique('id'))->sortKeys();
        } else {
            $grouped = $items->groupBy('category')->sortKeys();
        }

        // Items needed from this week's meal plan
        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();
        $plannedRecipes = MealPlanEntryItem::query()
            ->whereNotNull('recipe_id')
            ->whereHas('mealPlanEntry', fn ($entry) => $entry->whereBetween('date', [$weekStart, $weekEnd]))
            ->with(['recipe.recipeIngredients.shoppingItem'])
            ->get();

        $neededItems = $plannedRecipes
            ->flatMap(function ($plannedRecipe) {
                $portions = (float) ($plannedRecipe->portions ?? 1);

                return $plannedRecipe->recipe?->recipeIngredients->map(fn ($ingredient) => [
                    'shopping_item_id' => $ingredient->shopping_item_id,
                    'shopping_item' => $ingredient->shoppingItem,
                    'quantity' => $ingredient->quantity !== null ? (float) $ingredient->quantity * $portions : null,
                    'unit' => $ingredient->unit,
                    'recipe_name' => $plannedRecipe->recipe->name,
                ]) ?? collect();
            })
            ->groupBy(fn ($ingredient) => $ingredient['shopping_item_id'].'|'.($ingredient['unit'] ?? ''))
            ->map(fn ($ingredients) => [
                'shopping_item_id' => $ingredients->first()['shopping_item_id'],
                'shopping_item' => $ingredients->first()['shopping_item'],
                'quantity' => $ingredients->contains(fn ($ingredient) => $ingredient['quantity'] === null)
                    ? null
                    : $ingredients->sum('quantity'),
                'unit' => $ingredients->first()['unit'],
                'recipes' => $ingredients->pluck('recipe_name')->unique()->values(),
            ]);

        $neededItemIds = $neededItems->pluck('shopping_item_id')->unique();

        $places = ShoppingItemVariant::whereNotNull('place')->distinct()->pluck('place')->sort();

        $neededCount = $neededItemIds->count();

        return view('livewire.meal.meal-shopping', [
            'items' => $items,
            'grouped' => $grouped,
            'neededItems' => $neededItems,
            'neededItemIds' => $neededItemIds,
            'places' => $places,
            'totalItems' => $items->count(),
            'neededCount' => $neededCount,
        ]);
    }
}
