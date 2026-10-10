<?php

namespace App\Mcp\Tools\Shopping\Concerns;

use App\Models\Purchase;
use Illuminate\Contracts\JsonSchema\JsonSchema;

trait InteractsWithPurchases
{
    private function purchaseSchema(JsonSchema $schema): array
    {
        return [
            'purchased_at' => $schema->string()->required()->description('Fecha y hora local de la compra (YYYY-MM-DD HH:mm:ss).'),
            'store_id' => $schema->string()->description('UUID de la tienda del catálogo. Obligatorio al crear.'),
            'operation_key' => $schema->string()->description('UUID estable obligatorio al crear; reutilízalo en reintentos.'),
            'total_paid' => $schema->number()->description('Total final declarado, independiente de la suma de líneas.'),
            'payment_method' => $schema->string(),
            'ticket_reference' => $schema->string(),
            'notes' => $schema->string(),
            'lines' => $schema->array()->items($schema->object([
                'id' => $schema->string()->description('UUID de línea existente al editar; omitir en líneas nuevas.'),
                'shopping_item_id' => $schema->string()->required(),
                'shopping_item_variant_id' => $schema->string(),
                'packages' => $schema->number()->required(),
                'unit_price' => $schema->number()->description('Precio final por paquete; requiere variante y tienda.'),
                'ticket_text' => $schema->string(),
            ]))->required()->description('Todas las líneas. Al editar se eliminan las líneas existentes omitidas.'),
        ];
    }

    private function presentPurchase(Purchase $purchase): array
    {
        return $purchase->only(['id', 'operation_key', 'store_id', 'total_paid', 'payment_method', 'ticket_reference', 'notes']) + [
            'purchased_at' => $purchase->purchased_at->toIso8601String(),
            'store' => $purchase->store?->name,
            'lines' => $purchase->lines->map(fn ($line) => $line->only(['id', 'shopping_item_id', 'shopping_item_variant_id', 'product_name', 'variant_label', 'base_unit', 'content', 'packages', 'unit_price', 'stock_added', 'ticket_text']))->all(),
        ] + $purchase->summary();
    }
}
