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
        'category',
        'consume_by',
        'status',
        'next_purchase',
        'unit',
    ];

    protected function casts(): array
    {
        return [
            'consume_by' => 'date',
            'next_purchase' => 'boolean',
        ];
    }

    public function variants()
    {
        return $this->hasMany(ShoppingItemVariant::class);
    }

    public function aliases()
    {
        return $this->hasMany(ShoppingItemAlias::class);
    }
}
