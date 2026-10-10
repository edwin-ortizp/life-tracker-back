<?php

namespace App\Livewire\Meal;

use App\Livewire\Concerns\WithManagementCard;
use App\Services\Meal\MealNeeds;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Qué cocinar')]
class MealSuggestions extends Component
{
    use WithManagementCard;

    public $portions = 1;
    public $days = 7;

    public function updatedPortions(): void
    {
        $this->resetPage();
    }

    public function render()
    {
        $suggestions = app(MealNeeds::class)->suggestions((int) auth()->id(), min(999999, max(0.01, (float) $this->portions)), min(365, max(0, (int) $this->days)));

        return view('livewire.meal.meal-suggestions', ['suggestions' => $suggestions, 'recipes' => $this->paginateCollection(collect($suggestions['recipes']))]);
    }
}
