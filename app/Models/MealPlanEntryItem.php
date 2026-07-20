<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class MealPlanEntryItem extends Model
{
    use BelongsToUser;

    protected $fillable = [
        'meal_plan_entry_id',
        'recipe_id',
        'name',
        'portions',
        'calories',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'portions' => 'decimal:2',
            'calories' => 'integer',
            'position' => 'integer',
        ];
    }

    public function mealPlanEntry()
    {
        return $this->belongsTo(MealPlanEntry::class);
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }
}
