<?php

namespace App\Livewire\Meal;

use App\Models\ShoppingItem;
use App\Services\Meal\MealInventory;
use App\Services\Meal\MealNeeds;
use Livewire\Attributes\Locked;
use Livewire\Attributes\On;
use Livewire\Component;

class MealPlanShoppingEditor extends Component
{
    public bool $showForm = false;
    public string $since = '';
    public string $until = '';
    public array $variants = [];
    #[Locked]
    public string $operationKey = '';

    #[On('meal-shopping-preview')]
    public function openForm(): void
    {
        $this->resetValidation();
        $this->since = today()->startOfWeek()->toDateString();
        $this->until = today()->endOfWeek()->toDateString();
        $this->variants = [];
        $this->operationKey = (string) str()->uuid();
        $this->showForm = true;
    }

    public function closeForm(): void
    {
        $this->showForm = false;
    }

    public function save(): void
    {
        $this->validate(['since' => ['required', 'date'], 'until' => ['required', 'date', 'after_or_equal:since']]);
        app(MealInventory::class)->generateShopping((int) auth()->id(), $this->since, $this->until, array_filter($this->variants), $this->operationKey);
        $this->showForm = false;
        $this->dispatch('purchase-saved');
    }

    public function render()
    {
        $preview = ['needs' => [], 'warnings' => []];
        $products = collect();
        if ($this->showForm && strtotime($this->since) !== false && strtotime($this->until) !== false && $this->until >= $this->since) {
            $preview = app(MealNeeds::class)->preview((int) auth()->id(), $this->since, $this->until);
            $products = ShoppingItem::where('user_id', auth()->id())->withOffers()->whereIn('id', collect($preview['needs'])->pluck('shopping_item_id')->filter())->get()->keyBy('id');
        }

        return view('livewire.meal.meal-plan-shopping-editor', compact('preview', 'products'));
    }
}
