<?php

namespace App\Services\Meal;

use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\ShoppingItem;

/**
 * Calcula el costo y la nutrición de una receta a partir de sus ingredientes en unidad base.
 */
class RecipeCalculator
{
    /**
     * @return array{cost: ?float, cost_per_serving: ?float, partial_cost: float, nutrition: ?array, missing_cost: array, missing_nutrition: array}
     */
    public function calculate(Recipe $recipe): array
    {
        $recipe->loadMissing(['recipeIngredients.shoppingItem' => fn ($query) => $query->withOffers()]);
        $servings = max((float) ($recipe->servings ?: 1), 0.01);

        $cost = 0.0;
        $totals = ['calories' => 0.0, 'protein' => 0.0, 'carbs' => 0.0, 'fat' => 0.0];
        $missingCost = [];
        $missingNutrition = [];

        foreach ($recipe->recipeIngredients as $ingredient) {
            $product = $ingredient->shoppingItem;
            $name = $product?->name ?? 'Ingrediente';
            $quantity = $this->baseQuantity($ingredient);

            if ($quantity === null) {
                $reason = ! $product?->base_unit ? 'sin unidad base' : 'cantidad sin convertir a '.$product->base_unit;
                $missingCost[] = "{$name} ({$reason})";
                $missingNutrition[] = "{$name} ({$reason})";

                continue;
            }

            $unitCost = $product->costPerBaseUnit();
            $unitCost === null ? $missingCost[] = "{$name} (sin precio comparable)" : $cost += $quantity * $unitCost;

            $nutrition = $product->nutritionPerBaseUnit();
            if ($nutrition === null) {
                $missingNutrition[] = "{$name} (sin nutrición)";
            } else {
                foreach ($totals as $key => $value) {
                    $totals[$key] += $quantity * $nutrition[$key];
                }
            }
        }

        $hasIngredients = $recipe->recipeIngredients->isNotEmpty();
        $costComplete = $hasIngredients && $missingCost === [];
        $nutritionComplete = $hasIngredients && $missingNutrition === [];

        return [
            'cost' => $costComplete ? round($cost, 2) : null,
            'cost_per_serving' => $costComplete ? round($cost / $servings, 2) : null,
            'partial_cost' => round($cost, 2),
            'nutrition' => $nutritionComplete ? array_map(fn ($value) => (int) round($value / $servings), $totals) : null,
            'missing_cost' => $missingCost,
            'missing_nutrition' => $missingNutrition,
        ];
    }

    /** Guarda la nutrición calculada cuando todos los ingredientes la tienen; si no, la receta sigue en "manual". */
    public function refreshNutrition(Recipe $recipe): bool
    {
        $result = $this->calculate($recipe);
        if ($result['nutrition'] === null) {
            if ($recipe->nutrition_source === 'calculated') {
                $recipe->update(['nutrition_source' => 'manual']);
            }

            return false;
        }

        $recipe->update(['nutrition' => $result['nutrition'], 'nutrition_source' => 'calculated']);

        return true;
    }

    public function refreshRecipesUsing(ShoppingItem $product): void
    {
        Recipe::whereHas('recipeIngredients', fn ($query) => $query->where('shopping_item_id', $product->id))
            ->get()
            ->each(fn (Recipe $recipe) => $this->refreshNutrition($recipe));
    }

    /** Cantidad del ingrediente en la unidad base de su producto, o null si no se puede expresar así. */
    public function baseQuantity(RecipeIngredient $ingredient): ?float
    {
        $product = $ingredient->shoppingItem;
        if (! $product?->base_unit || $ingredient->quantity === null) {
            return null;
        }

        return UnitConverter::toBase((float) $ingredient->quantity, $ingredient->unit === $product->base_unit ? null : $ingredient->unit, $product->base_unit, $product->grams_per_piece);
    }
}
