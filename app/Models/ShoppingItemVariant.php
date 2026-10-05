<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use App\Services\Meal\UnitConverter;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class ShoppingItemVariant extends Model
{
    use BelongsToUser, HasUuids;

    public const PACKAGINGS = [
        'bolsa' => 'Bolsa',
        'caja' => 'Caja',
        'lata' => 'Lata',
        'botella' => 'Botella',
        'frasco' => 'Frasco',
        'paquete' => 'Paquete',
        'bandeja' => 'Bandeja',
        'suelta' => 'Unidad suelta',
    ];

    protected $fillable = [
        'shopping_item_id',
        'brand_id',
        'packaging',
        'content',
        'units_per_pack',
        'is_preferred',
        'barcode',
        'kcal',
        'protein',
        'carbs',
        'fat',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'float',
            'units_per_pack' => 'integer',
            'is_preferred' => 'boolean',
            'kcal' => 'float',
            'protein' => 'float',
            'carbs' => 'float',
            'fat' => 'float',
        ];
    }

    public function shoppingItem()
    {
        return $this->belongsTo(ShoppingItem::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function prices()
    {
        return $this->hasMany(ShoppingItemPrice::class);
    }

    /** Una variante sin contenido no entra en las comparaciones: queda pendiente de completar. */
    public function isComparable(): bool
    {
        return $this->content !== null && $this->content > 0;
    }

    /**
     * Precio más reciente por tienda.
     *
     * @return Collection<string, ShoppingItemPrice> indexado por store_id
     */
    public function latestPrices(): Collection
    {
        return $this->prices
            ->sortByDesc(fn (ShoppingItemPrice $price) => $price->observed_on->format('Ymd').$price->created_at?->format('YmdHis'))
            ->unique('store_id')
            ->keyBy('store_id');
    }

    /** Precio por 100 g, por litro o por unidad, calculado al vuelo y nunca guardado. */
    public function pricePerBase(ShoppingItemPrice|float|null $price, ?string $baseUnit = null): ?float
    {
        $amount = $price instanceof ShoppingItemPrice ? (float) $price->amount : $price;
        $baseUnit ??= $this->shoppingItem?->base_unit;

        if ($amount === null || ! $this->isComparable() || ! $baseUnit) {
            return null;
        }

        return $amount / $this->content * UnitConverter::comparisonSize($baseUnit);
    }

    /** Precio por unidad cuando el paquete trae varias (5 arepas). */
    public function pricePerPiece(ShoppingItemPrice|float|null $price): ?float
    {
        $amount = $price instanceof ShoppingItemPrice ? (float) $price->amount : $price;

        return $amount !== null && $this->units_per_pack ? $amount / $this->units_per_pack : null;
    }

    public function label(?string $baseUnit = null): string
    {
        $baseUnit ??= $this->shoppingItem?->base_unit;

        return collect([
            $this->brand?->name,
            self::PACKAGINGS[$this->packaging] ?? null,
            $this->isComparable() ? UnitConverter::format($this->content, $baseUnit) : null,
            $this->units_per_pack ? $this->units_per_pack.' und' : null,
        ])->filter()->implode(' · ') ?: 'Sin presentación';
    }
}
