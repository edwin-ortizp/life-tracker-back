<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class MealPlanEntry extends Model
{
    use BelongsToUser;

    protected $fillable = [
        'date',
        'meal_type',
        'recipe_id',
        'name',
        'notes',
        'calories',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }
}
