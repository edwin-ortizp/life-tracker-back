<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ShoppingItemAlias extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'shopping_item_id',
        'alias',
        'normalized_alias',
    ];

    public function shoppingItem()
    {
        return $this->belongsTo(ShoppingItem::class);
    }
}
