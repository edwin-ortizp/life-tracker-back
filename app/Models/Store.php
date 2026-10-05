<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use App\Services\Meal\CatalogNames;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['name', 'normalized_name'];

    protected static function booted(): void
    {
        static::saving(fn (Store $store) => $store->normalized_name = CatalogNames::normalize($store->name));
    }

    public function prices()
    {
        return $this->hasMany(ShoppingItemPrice::class);
    }
}
