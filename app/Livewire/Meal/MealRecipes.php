<?php

namespace App\Livewire\Meal;

use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\ShoppingItem;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('layouts.app')]
#[Title('Recetas')]
class MealRecipes extends Component
{
    use WithPagination;

    #[Url(as: 'q', history: true, keep: true)]
    public string $search = '';

    #[Url(as: 'type', history: true, keep: true)]
    public string $mealTypeFilter = '';

    #[Url(as: 'difficulty', history: true, keep: true)]
    public string $difficultyFilter = '';

    #[Url(as: 'fav', history: true)]
    public bool $favoriteFilter = false;

    public bool $showForm = false;
    public ?string $editingId = null;

    // Form fields
    public string $name = '';
    public string $description = '';
    public string $difficulty = 'facil';
    public ?int $prepTime = null;
    public string $mealType = 'comida';
    public string $instructions = '';
    public ?int $nutritionCalories = null;
    public ?int $nutritionProtein = null;
    public ?int $nutritionCarbs = null;
    public ?int $nutritionFat = null;
    public bool $favorite = false;
    public array $ingredients = [];

    public array $mealTypes = [
        'desayuno' => 'Desayuno',
        'almuerzo' => 'Almuerzo',
        'comida' => 'Comida',
        'merienda' => 'Merienda',
        'cena' => 'Cena',
    ];

    public array $difficulties = [
        'facil' => 'Fácil',
        'medio' => 'Medio',
        'dificil' => 'Difícil',
    ];

    public function updatedSearch()
    {
        $this->resetPage();
    }

    public function updatedMealTypeFilter()
    {
        $this->resetPage();
    }

    public function updatedDifficultyFilter()
    {
        $this->resetPage();
    }

    public function updatedFavoriteFilter()
    {
        $this->resetPage();
    }

    public function openForm(?string $id = null)
    {
        $this->resetValidation();

        if ($id) {
            $recipe = Recipe::with('recipeIngredients')->find($id);
            if (!$recipe) return;

            $this->editingId = $recipe->id;
            $this->name = $recipe->name;
            $this->description = $recipe->description ?? '';
            $this->difficulty = $recipe->difficulty ?? 'facil';
            $this->prepTime = $recipe->prep_time;
            $this->mealType = $recipe->meal_type ?? 'comida';
            $this->instructions = $recipe->instructions ?? '';
            $this->favorite = $recipe->favorite;
            $this->nutritionCalories = $recipe->nutrition['calories'] ?? null;
            $this->nutritionProtein = $recipe->nutrition['protein'] ?? null;
            $this->nutritionCarbs = $recipe->nutrition['carbs'] ?? null;
            $this->nutritionFat = $recipe->nutrition['fat'] ?? null;
            $this->ingredients = $recipe->recipeIngredients->map(fn($i) => [
                'shopping_item_id' => $i->shopping_item_id,
                'name' => $i->shoppingItem?->name ?? '',
                'quantity' => $i->quantity,
                'unit' => $i->unit ?? '',
                'notes' => $i->notes ?? '',
            ])->toArray();
        } else {
            $this->editingId = null;
            $this->name = '';
            $this->description = '';
            $this->difficulty = 'facil';
            $this->prepTime = null;
            $this->mealType = 'comida';
            $this->instructions = '';
            $this->favorite = false;
            $this->nutritionCalories = null;
            $this->nutritionProtein = null;
            $this->nutritionCarbs = null;
            $this->nutritionFat = null;
            $this->ingredients = [];
        }

        $this->showForm = true;
    }

    public function closeForm()
    {
        $this->showForm = false;
        $this->editingId = null;
    }

    public function addIngredient()
    {
        $this->ingredients[] = ['shopping_item_id' => null, 'name' => '', 'quantity' => '', 'unit' => '', 'notes' => ''];
    }

    public function removeIngredient(int $index)
    {
        unset($this->ingredients[$index]);
        $this->ingredients = array_values($this->ingredients);
    }

    public function save()
    {
        $this->validate([
            'name' => 'required|string|max:255',
            'difficulty' => 'required|in:facil,medio,dificil',
            'mealType' => 'required|in:desayuno,almuerzo,comida,merienda,cena',
        ]);

        $nutrition = array_filter([
            'calories' => $this->nutritionCalories,
            'protein' => $this->nutritionProtein,
            'carbs' => $this->nutritionCarbs,
            'fat' => $this->nutritionFat,
        ], fn($v) => $v !== null);

        $data = [
            'name' => trim($this->name),
            'description' => $this->description ?: null,
            'difficulty' => $this->difficulty,
            'prep_time' => $this->prepTime,
            'meal_type' => $this->mealType,
            'instructions' => $this->instructions ?: null,
            'nutrition' => $nutrition ?: null,
            'favorite' => $this->favorite,
        ];

        if ($this->editingId) {
            $recipe = Recipe::find($this->editingId);
            if (!$recipe) return;
            $recipe->update($data);
        } else {
            $recipe = Recipe::create($data);
        }

        // Sync ingredients
        $recipe->recipeIngredients()->delete();
        foreach ($this->ingredients as $ingredient) {
            if (empty($ingredient['name']) && empty($ingredient['shopping_item_id'])) continue;

            $shoppingItemId = $ingredient['shopping_item_id'];
            if (!$shoppingItemId && !empty($ingredient['name'])) {
                $item = ShoppingItem::firstOrCreate(
                    ['name' => trim($ingredient['name'])],
                    ['status' => 'available', 'stock' => 0, 'to_buy' => 0]
                );
                $shoppingItemId = $item->id;
            }

            if ($shoppingItemId) {
                $recipe->recipeIngredients()->create([
                    'shopping_item_id' => $shoppingItemId,
                    'quantity' => $ingredient['quantity'] ?: null,
                    'unit' => $ingredient['unit'] ?: null,
                    'notes' => $ingredient['notes'] ?: null,
                ]);
            }
        }

        $this->closeForm();
    }

    public function toggleFavorite(string $id)
    {
        $recipe = Recipe::find($id);
        if ($recipe) {
            $recipe->update(['favorite' => !$recipe->favorite]);
        }
    }

    public function delete(string $id)
    {
        Recipe::where('id', $id)->delete();
    }

    public function render()
    {
        $recipes = Recipe::query()
            ->when($this->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($this->mealTypeFilter, fn($q, $t) => $q->where('meal_type', $t))
            ->when($this->difficultyFilter, fn($q, $d) => $q->where('difficulty', $d))
            ->when($this->favoriteFilter, fn($q) => $q->where('favorite', true))
            ->withCount('recipeIngredients')
            ->orderByDesc('updated_at')
            ->paginate(18);

        $shoppingItems = ShoppingItem::orderBy('name')->get(['id', 'name']);

        return view('livewire.meal.meal-recipes', [
            'recipes' => $recipes,
            'shoppingItems' => $shoppingItems,
        ]);
    }
}
