<?php

namespace App\Livewire\Meal;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\MealPlanEntry;
use App\Models\Recipe;
use App\Models\MealPreparation;
use App\Models\ShoppingItem;
use App\Services\Meal\MealInventory;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Locked;
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
    public string $formStatus = 'planned';
    public array $consumption = [];
    public string $consumptionMode = '';
    public string $outsideNotes = '';
    public $outsideCalories = null;
    public string $targetDate = '';
    public string $targetMealType = 'cena';
    public string $selectedPreparation = '';
    #[Locked]
    public string $operationKey = '';

    public array $mealTypes = [
        'desayuno' => 'Desayuno',
        'comida' => 'Onces (mañana)',
        'almuerzo' => 'Almuerzo',
        'merienda' => 'Merienda (tarde)',
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

        $existing = MealPlanEntry::where('user_id', auth()->id())->with(['items.recipe', 'items.preparation'])
            ->whereDate('date', $date)
            ->where('meal_type', $mealType)
            ->first();

        $this->editingId = $existing?->id;
        $this->formStatus = $existing?->status ?? 'planned';
        $this->consumption = $existing?->consumption ?? [];
        $this->consumptionMode = $existing?->consumption_mode ?? '';
        $this->outsideNotes = '';
        $this->outsideCalories = null;
        $this->operationKey = (string) str()->uuid();
        $this->targetDate = $date;
        $this->targetMealType = $mealType;
        $this->selectedPreparation = '';
        $this->formNotes = $existing?->notes ?? '';
        $this->formCalories = $existing?->calories;
        $this->formItems = $existing?->items->map(fn ($item) => [
            'key' => 'item-'.$item->id,
            'id' => $item->id,
            'recipe_id' => $item->recipe_id,
            'preparation_id' => $item->preparation_id,
            'ingredients' => $item->ingredients ?? [],
            'name' => $item->recipe?->name ?? $item->name ?? '',
            'portions' => ($item->recipe_id || $item->preparation_id) ? (float) ($item->portions ?? 1) : null,
            'calories' => $item->recipe_id ? null : $item->calories,
            'recipe_calories' => $item->preparation_id ? ($item->preparation?->nutrition['calories'] ?? null) : ($item->recipe?->nutrition['calories'] ?? null),
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
            'preparation_id' => null,
            'ingredients' => [],
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
            'preparation_id' => null,
            'ingredients' => [],
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
            if (!empty($item['recipe_id']) || !empty($item['preparation_id'])) {
                return ((float) ($item['recipe_calories'] ?? 0)) * ((float) ($item['portions'] ?? 1));
            }

            return (int) ($item['calories'] ?? 0);
        }));
    }

    public function formHasIncompleteCalories(): bool
    {
        return collect($this->formItems)->contains(fn ($item) =>
            (!empty($item['recipe_id']) || !empty($item['preparation_id'])) && $item['recipe_calories'] === null
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

        app(MealInventory::class)->plan((int) auth()->id(), $this->planData(), $this->operationKey.':save');

        $this->closeForm();
    }

    public function delete(int $id): void
    {
        app(MealInventory::class)->rearrange((int) auth()->id(), $id, 'delete', [], $this->operationKey.':delete');
        $this->closeForm();
    }

    private function planData(): array
    {
        return ['entry_id' => $this->editingId, 'date' => $this->formDate, 'meal_type' => $this->formMealType, 'mode' => 'replace',
            'notes' => trim($this->formNotes) ?: null, 'calories' => $this->formCalories, 'items' => $this->formItems];
    }

    public function addPreparation(): void
    {
        $prep = MealPreparation::where('user_id', auth()->id())->where('cancelled', false)->find($this->selectedPreparation);
        if (! $prep) {
            $this->addError('inventory', 'Elige una preparación disponible.');
            return;
        }
        $this->formItems[] = ['key' => 'prepared-'.str()->uuid(), 'recipe_id' => null, 'preparation_id' => $prep->id,
            'name' => $prep->name, 'portions' => 1, 'calories' => null, 'recipe_calories' => $prep->nutrition['calories'] ?? null, 'ingredients' => []];
    }

    public function addIngredient(int $index): void
    {
        if (isset($this->formItems[$index]) && empty($this->formItems[$index]['recipe_id']) && empty($this->formItems[$index]['preparation_id'])) {
            $this->formItems[$index]['ingredients'][] = ['shopping_item_id' => '', 'quantity' => null, 'unit' => ''];
        }
    }

    public function removeIngredient(int $index, int $ingredient): void
    {
        unset($this->formItems[$index]['ingredients'][$ingredient]);
        $this->formItems[$index]['ingredients'] = array_values($this->formItems[$index]['ingredients']);
    }

    public function consume(string $mode = 'home'): void
    {
        $this->validate(['outsideCalories' => ['nullable', 'integer', 'min:0'], 'outsideNotes' => ['string', 'max:5000']]);
        DB::transaction(function () use ($mode) {
            $inventory = app(MealInventory::class);
            if ($mode === 'outside' && empty($this->formItems)) {
                $inventory->consumeAt((int) auth()->id(), ['date' => $this->formDate, 'meal_type' => $this->formMealType, 'mode' => 'outside', 'notes' => $this->outsideNotes, 'calories' => $this->outsideCalories], $this->operationKey.':outside');
            } else {
                $saved = $inventory->plan((int) auth()->id(), $this->planData(), $this->operationKey.':consume-plan');
                $inventory->consume((int) auth()->id(), $saved['meal_id'], $mode === 'outside' ? ['mode' => 'outside', 'notes' => $this->outsideNotes, 'calories' => $this->outsideCalories] : ['mode' => 'home'], $this->operationKey.':consume');
            }
        });
        $this->openForm($this->formDate, $this->formMealType);
    }

    public function revertConsumption(): void
    {
        app(MealInventory::class)->revert((int) auth()->id(), (int) $this->editingId, $this->operationKey.':revert');
        $this->openForm($this->formDate, $this->formMealType);
    }

    public function rearrange(string $action): void
    {
        app(MealInventory::class)->rearrange((int) auth()->id(), (int) $this->editingId, $action, ['date' => $this->targetDate, 'meal_type' => $this->targetMealType], $this->operationKey.':'.$action);
        $this->closeForm();
    }

    public function render()
    {
        $weekStart = Carbon::parse($this->selectedDate)->startOfWeek();
        $weekDates = collect(range(0, 6))->map(fn ($day) => $weekStart->copy()->addDays($day));
        $entries = MealPlanEntry::where('user_id', auth()->id())->with(['items.recipe', 'items.preparation'])
            ->whereDate('date', '>=', $weekStart->toDateString())->whereDate('date', '<=', $weekStart->copy()->endOfWeek()->toDateString())
            ->get();

        // Calorías totales por día, sumando todas las comidas planificadas.
        $dailyCalories = $entries->where('status', 'planned')->groupBy(fn ($entry) => $entry->date->format('Y-m-d'))
            ->map(fn ($dayEntries) => $dayEntries->sum('effective_calories'));
        $consumedCalories = $entries->where('status', 'consumed')->groupBy(fn ($entry) => $entry->date->format('Y-m-d'))
            ->map(fn ($dayEntries) => $dayEntries->sum(fn ($entry) => $entry->consumption['calories'] ?? 0));
        $plannedDays = $dailyCalories->filter()->count();
        $weekCalories = $dailyCalories->sum();

        $entries = $entries->groupBy(fn ($entry) => $entry->date->format('Y-m-d').'|'.$entry->meal_type);

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

        return view('livewire.meal.meal-weekly', compact('weekDates', 'entries', 'weekStart', 'recipeResults', 'dailyCalories', 'consumedCalories', 'plannedDays', 'weekCalories') + [
            'products' => $this->showForm ? ShoppingItem::where('user_id', auth()->id())->orderBy('name')->get(['id', 'name', 'base_unit']) : collect(),
            'preparations' => $this->showForm ? MealPreparation::where('user_id', auth()->id())->where('cancelled', false)->orderByDesc('cooked_at')->get()->filter(fn ($p) => $p->remaining() > 0) : collect(),
        ]);
    }
}
