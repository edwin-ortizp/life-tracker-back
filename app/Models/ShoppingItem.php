<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ShoppingItem extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'name',
        'stock',
        'to_buy',
        'price',
        'category',
        'place',
        'consume_by',
        'status',
        'next_purchase',
        'unit',
        'barcode',
    ];

    protected function casts(): array
    {
        return [
            'consume_by' => 'date',
            'next_purchase' => 'boolean',
            'price' => 'decimal:2',
        ];
    }
}
