<?php

namespace App\Services\Meal;

use App\Models\MealPlanEntry;
use App\Models\MealPreparation;
use App\Models\Recipe;
use App\Models\ShoppingItem;
use Carbon\Carbon;

class MealNeeds
{
    public function aggregate(int $userId, array $ingredients): array
    {
        return collect($ingredients)->groupBy('shopping_item_id')->map(function ($rows, $id) use ($userId) {
            $product = ShoppingItem::where('user_id', $userId)->withOffers()->find($id);
            $incomplete = ! $product || $rows->contains(fn ($row) => $row['quantity'] === null || $row['unit'] !== $product->base_unit);
            $quantity = $incomplete ? null : round($rows->sum('quantity'), 3);
            $missing = $quantity === null ? null : round(max(0, $quantity - $product->stock), 3);
            $variant = $product?->variants->first(fn ($v) => $v->is_preferred && $v->isComparable());

            return ['shopping_item_id' => $product?->id, 'name' => $product?->name ?? $rows->first()['name'], 'unit' => $product?->base_unit,
                'quantity' => $quantity, 'stock' => $product?->stock, 'missing' => $missing,
                'variant_id' => $variant?->id, 'packages' => $missing !== null && $variant ? (int) ceil($missing / $variant->content) : null,
                'cost' => $missing !== null && $product?->costPerBaseUnit() !== null ? $missing * $product->costPerBaseUnit() : null];
        })->values()->all();
    }

    public function preview(int $userId, string $since, string $until): array
    {
        $inventory = app(MealInventory::class);
        $rows = [];
        $warnings = [];
        $entries = MealPlanEntry::where('user_id', $userId)->where('status', 'planned')->whereDate('date', '>=', $since)->whereDate('date', '<=', $until)
            ->with(['items.recipe', 'items.preparation'])->get();
        foreach ($entries as $entry) {
            $rows = array_merge($rows, $inventory->entryIngredients($userId, $entry, false));
            foreach ($entry->items as $item) {
                if (! $item->preparation_id && (($item->recipe_id && $item->recipe->recipeIngredients()->count() === 0) || (! $item->recipe_id && ! $item->ingredients))) {
                    $warnings[] = ($item->recipe?->name ?? $item->name).': sin ingredientes enlazados';
                }
            }
        }

        return ['since' => $since, 'until' => $until, 'needs' => $this->aggregate($userId, $rows), 'warnings' => array_values(array_unique($warnings))];
    }

    public function suggestions(int $userId, float $portions = 1, int $days = 7): array
    {
        $today = today();
        $limit = $today->copy()->addDays($days);
        $products = ShoppingItem::where('user_id', $userId)->where('stock', '>', 0)->whereNotNull('consume_by')->whereDate('consume_by', '<=', $limit->toDateString())->orderBy('consume_by')->get();
        $preparations = MealPreparation::where('user_id', $userId)->where('cancelled', false)->whereNotNull('consume_by')->whereDate('consume_by', '<=', $limit->toDateString())->orderBy('consume_by')->get()
            ->filter(fn ($p) => $p->remaining() > 0)->map(fn ($p) => $p->summary())->values();
        $inventory = app(MealInventory::class);
        $recipes = Recipe::where('user_id', $userId)->orderBy('name')->get()->map(function ($recipe) use ($userId, $portions, $products, $inventory) {
            $rows = $inventory->recipeIngredients($userId, $recipe, $portions, false);
            $needs = $this->aggregate($userId, $rows);
            $incomplete = $rows === [] || collect($needs)->contains(fn ($row) => $row['missing'] === null);

            return ['id' => $recipe->id, 'name' => $recipe->name, 'portions' => $portions, 'can_cook' => ! $incomplete && collect($needs)->every(fn ($row) => $row['missing'] === 0.0),
                'incomplete' => $incomplete, 'expiring_products' => collect($needs)->pluck('shopping_item_id')->intersect($products->pluck('id'))->count(), 'ingredients' => $needs];
        })->sortBy([['can_cook', 'desc'], ['expiring_products', 'desc'], ['name', 'asc']])->values()->all();
        $productDates = $products->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'stock' => $p->stock, 'unit' => $p->base_unit, 'consume_by' => $p->consume_by->toDateString()]);
        $expired = fn ($row) => Carbon::parse($row['consume_by'])->lt($today);

        return ['days' => $days, 'recipes' => $recipes, 'expired_products' => $productDates->filter($expired)->values()->all(), 'expiring_products' => $productDates->reject($expired)->values()->all(),
            'expired_preparations' => $preparations->filter($expired)->values()->all(), 'expiring_preparations' => $preparations->reject($expired)->values()->all()];
    }
}
