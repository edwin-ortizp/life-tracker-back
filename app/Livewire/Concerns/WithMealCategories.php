<?php

namespace App\Livewire\Concerns;

use App\Models\MealCategory;
use Livewire\Attributes\Computed;

trait WithMealCategories
{
    #[Computed]
    public function categoryOptions(): array
    {
        return MealCategory::options();
    }
}
