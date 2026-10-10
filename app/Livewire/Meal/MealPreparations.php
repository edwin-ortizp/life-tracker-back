<?php

namespace App\Livewire\Meal;

use App\Livewire\Concerns\WithManagementCard;
use App\Models\MealPreparation;
use App\Models\Recipe;
use App\Services\Meal\MealInventory;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Locked;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Preparaciones')]
class MealPreparations extends Component
{
    use WithManagementCard;

    public bool $showForm = false;
    public string $recipeId = '';
    public $portions = 1;
    public string $cookedAt = '';
    public string $consumeBy = '';
    public string $search = '';
    #[Locked]
    public string $operationKey = '';

    public function openForm(): void
    {
        $this->resetValidation();
        $this->reset(['recipeId', 'portions', 'consumeBy']);
        $this->cookedAt = now()->format('Y-m-d\TH:i');
        $this->operationKey = (string) str()->uuid();
        $this->showForm = true;
    }

    public function closeForm(): void
    {
        $this->showForm = false;
    }

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function save(): void
    {
        app(MealInventory::class)->cook((int) auth()->id(), ['recipe_id' => $this->recipeId, 'portions' => $this->portions, 'cooked_at' => $this->cookedAt, 'consume_by' => $this->consumeBy ?: null], $this->operationKey);
        $this->showForm = false;
    }

    public function cancel(string $id): void
    {
        app(MealInventory::class)->cancelPreparation((int) auth()->id(), $id);
    }

    public function render()
    {
        return view('livewire.meal.meal-preparations', ['preparations' => MealPreparation::where('user_id', auth()->id())->where('cancelled', false)
            ->when($this->search, fn ($q) => $q->where('name', 'like', '%'.$this->search.'%'))->orderByDesc('cooked_at')->paginate($this->perPage()),
            'recipes' => $this->showForm ? Recipe::where('user_id', auth()->id())->orderBy('name')->pluck('name', 'id')->all() : []]);
    }
}
