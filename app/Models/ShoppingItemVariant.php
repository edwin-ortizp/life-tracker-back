<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ShoppingItemVariant extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'shopping_item_id',
        'place',
        'price',
        'barcode',
        'presentation',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
        ];
    }

    public function shoppingItem()
    {
        return $this->belongsTo(ShoppingItem::class);
    }
}
