<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'name',
        'description',
        'difficulty',
        'prep_time',
        'servings',
        'meal_type',
        'instructions',
        'nutrition',
        'nutrition_source',
        'favorite',
    ];

    protected function casts(): array
    {
        return [
            'nutrition' => 'array',
            'favorite' => 'boolean',
            'servings' => 'float',
        ];
    }

    public function recipeIngredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function mealPlanItems()
    {
        return $this->hasMany(MealPlanEntryItem::class);
    }
}
