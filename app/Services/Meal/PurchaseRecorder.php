<?php

namespace App\Services\Meal;

use App\Models\ShoppingItem;
use App\Models\ShoppingItemPrice;
use App\Models\ShoppingItemVariant;
use App\Models\Store;
use Illuminate\Support\Facades\DB;

/**
 * Registra una compra: suma al stock lo comprado, saca el producto de la lista
 * y, si se indica, guarda el precio pagado como precio de ticket verificado.
 */
class PurchaseRecorder
{
    /** @return array{stock_added: float, price: ?ShoppingItemPrice} */
    public function record(ShoppingItem $item, ?ShoppingItemVariant $variant, float $packages, ?float $amountPaid = null, ?Store $store = null): array
    {
        return DB::transaction(function () use ($item, $variant, $packages, $amountPaid, $store) {
            $stockAdded = match (true) {
                (bool) $variant?->isComparable() => $variant->content * $packages,
                $item->base_unit === 'unit' => $packages,
                default => 0.0,
            };

            $item->update([
                'stock' => (float) $item->stock + $stockAdded,
                'next_purchase' => false,
                'to_buy' => 0,
            ]);

            $price = null;
            if ($variant && $amountPaid !== null && $store) {
                // El precio pagado se registra por paquete, igual que los demás precios de la variante.
                $price = $variant->prices()->create([
                    'store_id' => $store->id,
                    'amount' => round($amountPaid, 2),
                    'observed_on' => now()->toDateString(),
                    'source' => 'ticket',
                    'paid' => true,
                    'verified_at' => now(),
                    'verified_by' => auth()->id(),
                ]);
            }

            return ['stock_added' => (float) $stockAdded, 'price' => $price];
        });
    }
}
