<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use App\Services\Meal\CatalogNames;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['name', 'normalized_name', 'is_store_brand', 'store_id'];

    protected function casts(): array
    {
        return ['is_store_brand' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::saving(fn (Brand $brand) => $brand->normalized_name = CatalogNames::normalize($brand->name));
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function variants()
    {
        return $this->hasMany(ShoppingItemVariant::class);
    }
}
