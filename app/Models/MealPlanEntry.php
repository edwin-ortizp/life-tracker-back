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
        'notes',
        'calories',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function items()
    {
        return $this->hasMany(MealPlanEntryItem::class)->orderBy('position');
    }

    public function calculatedCalories(): int
    {
        return (int) round($this->items->sum(function (MealPlanEntryItem $item) {
            if (!$item->recipe_id) {
                return $item->calories ?? 0;
            }

            $calories = $item->recipe?->nutrition['calories'] ?? 0;

            return $calories * (float) ($item->portions ?? 1);
        }));
    }

    public function hasIncompleteCalories(): bool
    {
        return $this->items->contains(fn (MealPlanEntryItem $item) =>
            $item->recipe_id && !isset($item->recipe?->nutrition['calories'])
        );
    }

    public function getEffectiveCaloriesAttribute(): int
    {
        return $this->calories ?? $this->calculatedCalories();
    }
}
