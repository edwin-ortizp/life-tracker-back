<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class RecipeIngredient extends Model
{
    use BelongsToUser;

    protected $fillable = [
        'recipe_id',
        'shopping_item_id',
        'quantity',
        'unit',
        'notes',
    ];

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }

    public function shoppingItem()
    {
        return $this->belongsTo(ShoppingItem::class);
    }
}
