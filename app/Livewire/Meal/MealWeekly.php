<?php

namespace App\Livewire\Meal;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\MealPlanEntry;
use App\Models\Recipe;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Comidas')]
class MealWeekly extends Component
{
    use HasUrlDate;

    public bool $showForm = false;
    public string $formDate = '';
    public string $formMealType = '';
    public string $formNotes = '';
    public ?int $formCalories = null;
    public ?int $editingId = null;
    public string $recipeSearch = '';
    public array $formItems = [];

    public array $mealTypes = [
        'desayuno' => 'Desayuno',
        'almuerzo' => 'Almuerzo',
        'comida' => 'Comida',
        'merienda' => 'Merienda',
        'cena' => 'Cena',
    ];

    public function mount(): void
    {
        $this->initializeSelectedDate();
    }

    public function previousWeek(): void
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->subWeek()->toDateString();
    }

    public function nextWeek(): void
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->addWeek()->toDateString();
    }

    public function thisWeek(): void
    {
        $this->selectedDate = now()->toDateString();
    }

    public function openForm(string $date, string $mealType): void
    {
        abort_unless(array_key_exists($mealType, $this->mealTypes), 404);
        $this->resetValidation();

        $existing = MealPlanEntry::with('items.recipe')
            ->where('date', $date)
            ->where('meal_type', $mealType)
            ->first();

        $this->editingId = $existing?->id;
        $this->formNotes = $existing?->notes ?? '';
        $this->formCalories = $existing?->calories;
        $this->formItems = $existing?->items->map(fn ($item) => [
            'key' => 'item-'.$item->id,
            'recipe_id' => $item->recipe_id,
            'name' => $item->recipe?->name ?? $item->name ?? '',
            'portions' => $item->recipe_id ? (float) ($item->portions ?? 1) : null,
            'calories' => $item->recipe_id ? null : $item->calories,
            'recipe_calories' => $item->recipe?->nutrition['calories'] ?? null,
        ])->values()->toArray() ?? [];
        $this->recipeSearch = '';
        $this->formDate = $date;
        $this->formMealType = $mealType;
        $this->showForm = true;
    }

    public function closeForm(): void
    {
        $this->showForm = false;
        $this->editingId = null;
        $this->recipeSearch = '';
        $this->resetValidation();
    }

    public function addRecipe(string $recipeId): void
    {
        if (collect($this->formItems)->contains(fn ($item) => ($item['recipe_id'] ?? null) === $recipeId)) {
            return;
        }

        $recipe = Recipe::find($recipeId);
        if (!$recipe) {
            return;
        }

        $this->formItems[] = [
            'key' => 'recipe-'.$recipe->id,
            'recipe_id' => $recipe->id,
            'name' => $recipe->name,
            'portions' => 1,
            'calories' => null,
            'recipe_calories' => $recipe->nutrition['calories'] ?? null,
        ];
        $this->recipeSearch = '';
    }

    public function addCustomItem(): void
    {
        $this->formItems[] = [
            'key' => 'custom-'.str()->uuid(),
            'recipe_id' => null,
            'name' => '',
            'portions' => null,
            'calories' => null,
            'recipe_calories' => null,
        ];
    }

    public function removeItem(int $index): void
    {
        if (!array_key_exists($index, $this->formItems)) {
            return;
        }

        unset($this->formItems[$index]);
        $this->formItems = array_values($this->formItems);
    }

    public function moveItem(int $index, int $direction): void
    {
        $target = $index + $direction;
        if (!isset($this->formItems[$index], $this->formItems[$target])) {
            return;
        }

        [$this->formItems[$index], $this->formItems[$target]] = [$this->formItems[$target], $this->formItems[$index]];
        $this->formItems = array_values($this->formItems);
    }

    public function useCalculatedCalories(): void
    {
        $this->formCalories = null;
    }

    public function calculatedFormCalories(): int
    {
        return (int) round(collect($this->formItems)->sum(function ($item) {
            if (!empty($item['recipe_id'])) {
                return ((float) ($item['recipe_calories'] ?? 0)) * ((float) ($item['portions'] ?? 1));
            }

            return (int) ($item['calories'] ?? 0);
        }));
    }

    public function formHasIncompleteCalories(): bool
    {
        return collect($this->formItems)->contains(fn ($item) =>
            !empty($item['recipe_id']) && $item['recipe_calories'] === null
        );
    }

    public function save(): void
    {
        $this->validate([
            'formDate' => ['required', 'date'],
            'formMealType' => ['required', Rule::in(array_keys($this->mealTypes))],
            'formNotes' => ['nullable', 'string', 'max:5000'],
            'formCalories' => ['nullable', 'integer', 'min:0'],
            'formItems' => ['required', 'array', 'min:1'],
            'formItems.*.recipe_id' => ['nullable', 'uuid'],
            'formItems.*.name' => ['nullable', 'string', 'max:255'],
            'formItems.*.portions' => ['nullable', 'numeric', 'gt:0'],
            'formItems.*.calories' => ['nullable', 'integer', 'min:0'],
        ], [
            'formItems.required' => 'Agrega al menos una receta o un elemento libre.',
            'formItems.min' => 'Agrega al menos una receta o un elemento libre.',
        ]);

        $recipeIds = collect($this->formItems)->pluck('recipe_id')->filter();
        if ($recipeIds->duplicates()->isNotEmpty()) {
            $this->addError('formItems', 'Una receta no puede repetirse dentro de la misma comida. Ajusta sus porciones.');
            return;
        }

        $validRecipeIds = Recipe::whereIn('id', $recipeIds)->pluck('id');
        if ($validRecipeIds->count() !== $recipeIds->count()) {
            $this->addError('formItems', 'Una de las recetas seleccionadas ya no está disponible.');
            return;
        }

        foreach ($this->formItems as $index => $item) {
            if (empty($item['recipe_id']) && trim((string) ($item['name'] ?? '')) === '') {
                $this->addError("formItems.$index.name", 'Escribe el nombre del elemento.');
                return;
            }
        }

        DB::transaction(function () {
            $entry = $this->editingId ? MealPlanEntry::find($this->editingId) : null;
            $data = [
                'date' => $this->formDate,
                'meal_type' => $this->formMealType,
                'notes' => trim($this->formNotes) ?: null,
                'calories' => $this->formCalories,
            ];

            if ($entry) {
                $entry->update($data);
                $entry->items()->delete();
            } else {
                $entry = MealPlanEntry::create($data);
            }

            foreach ($this->formItems as $position => $item) {
                $entry->items()->create([
                    'recipe_id' => $item['recipe_id'] ?: null,
                    'name' => $item['recipe_id'] ? null : trim($item['name']),
                    'portions' => $item['recipe_id'] ? $item['portions'] : null,
                    'calories' => $item['recipe_id'] ? null : ($item['calories'] ?? null),
                    'position' => $position,
                ]);
            }
        });

        $this->closeForm();
    }

    public function delete(int $id): void
    {
        MealPlanEntry::where('id', $id)->delete();
        $this->closeForm();
    }

    public function render()
    {
        $weekStart = Carbon::parse($this->selectedDate)->startOfWeek();
        $weekDates = collect(range(0, 6))->map(fn ($day) => $weekStart->copy()->addDays($day));
        $entries = MealPlanEntry::with('items.recipe')
            ->whereBetween('date', [$weekStart->toDateString(), $weekStart->copy()->endOfWeek()->toDateString()])
            ->get()
            ->groupBy(fn ($entry) => $entry->date->format('Y-m-d').'|'.$entry->meal_type);

        $selectedRecipeIds = collect($this->formItems)->pluck('recipe_id')->filter();
        $recipeResults = collect();
        if ($this->showForm) {
            $term = trim($this->recipeSearch);
            $recipeResults = Recipe::query()
                ->when($term !== '', fn ($query) => $query->where('name', 'like', '%'.$term.'%'))
                ->when($selectedRecipeIds->isNotEmpty(), fn ($query) => $query->whereNotIn('id', $selectedRecipeIds))
                ->orderByRaw('CASE WHEN meal_type = ? THEN 0 ELSE 1 END', [$this->formMealType])
                ->orderByDesc('favorite')
                ->orderBy('name')
                ->limit(12)
                ->get(['id', 'name', 'meal_type', 'favorite', 'nutrition']);
        }

        return view('livewire.meal.meal-weekly', compact(
            'weekDates', 'entries', 'weekStart', 'recipeResults'
        ));
    }
}
