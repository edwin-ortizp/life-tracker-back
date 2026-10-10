<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MealPreparation extends Model
{
    use BelongsToUser, HasUuids;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['cooked_at' => 'datetime', 'consume_by' => 'date', 'portions' => 'float', 'ingredients' => 'array', 'nutrition' => 'array', 'cancelled' => 'boolean'];
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }

    public function remaining(): float
    {
        return $this->cancelled ? 0.0 : round($this->portions + MealInventoryMovement::where('user_id', $this->user_id)->where('preparation_id', $this->id)->sum('delta'), 2);
    }

    public function plannedItems()
    {
        return $this->hasMany(MealPlanEntryItem::class, 'preparation_id')->where('user_id', $this->user_id)
            ->whereHas('mealPlanEntry', fn ($q) => $q->where('user_id', $this->user_id)->where('status', 'planned'));
    }

    public function reserved(): float
    {
        return (float) MealPlanEntryItem::where('user_id', $this->user_id)->where('preparation_id', $this->id)
            ->whereHas('mealPlanEntry', fn ($q) => $q->where('user_id', $this->user_id)->where('status', 'planned'))->sum('portions');
    }

    public function summary(): array
    {
        $remaining = $this->remaining();
        $reserved = $this->reserved();

        return ['id' => $this->id, 'name' => $this->name, 'recipe_id' => $this->recipe_id, 'cooked_at' => $this->cooked_at->toIso8601String(), 'consume_by' => $this->consume_by?->toDateString(), 'produced' => $this->portions, 'consumed' => $this->cancelled ? 0.0 : round($this->portions - $remaining, 2), 'reserved' => $reserved, 'available' => round($remaining - $reserved, 2), 'remaining' => $remaining, 'cancelled' => $this->cancelled, 'ingredients' => $this->ingredients, 'nutrition' => $this->nutrition];
    }
}
