<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ShoppingItem extends Model
{
    use BelongsToUser, HasUuids;

    public const CATEGORIES = [
        'frutas_verduras' => 'Frutas y verduras',
        'carnes' => 'Carnes y pescados',
        'lacteos' => 'Lácteos y huevos',
        'panaderia' => 'Panadería',
        'cereales' => 'Cereales y granos',
        'enlatados' => 'Enlatados y conservas',
        'condimentos' => 'Condimentos y salsas',
        'bebidas' => 'Bebidas',
        'congelados' => 'Congelados',
        'snacks' => 'Snacks y dulces',
        'limpieza' => 'Limpieza',
        'higiene' => 'Higiene personal',
        'mascotas' => 'Mascotas',
        'otros' => 'Otros',
    ];

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

    /**
     * Precio unitario estimado: el de la tienda indicada o, sin tienda, la variante más barata con precio.
     */
    public function estimatedPrice(?string $place = null): ?float
    {
        $prices = $this->variants
            ->when($place, fn ($variants) => $variants->where('place', $place))
            ->pluck('price')
            ->filter(fn ($price) => $price !== null);

        return $prices->isEmpty() ? null : (float) $prices->min();
    }

    public function estimatedSubtotal(?string $place = null): ?float
    {
        $price = $this->estimatedPrice($place);

        return $price === null ? null : $price * max((int) $this->to_buy, 1);
    }
}
