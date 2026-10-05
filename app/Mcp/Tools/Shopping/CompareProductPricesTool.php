<?php

namespace App\Mcp\Tools\Shopping;

use App\Mcp\Tools\Shopping\Concerns\ResolvesShoppingItem;
use App\Models\ShoppingItem;
use App\Services\Meal\UnitConverter;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Compara los precios de las variantes de un producto entre marcas y tiendas por 100 g, por litro o por unidad, de menor a mayor. Incluye fecha, fuente y si el precio está verificado o desactualizado, y lista aparte las variantes pendientes (sin contenido).')]
class CompareProductPricesTool extends Tool
{
    use ResolvesShoppingItem;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            'item_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'store' => ['nullable', 'string'],
        ]);

        $item = $this->resolveShoppingItem($data['item_id'] ?? null, $data['name'] ?? null);
        if ($item instanceof Response) {
            return $item;
        }

        $item = ShoppingItem::withOffers()->find($item->id);
        if (! $item->base_unit) {
            return Response::error("\"{$item->name}\" no tiene unidad base; defínela (g, ml o unit) para poder comparar.");
        }

        $offers = $item->offers()
            ->filter(fn ($offer) => $offer['per_base'] !== null)
            ->when(filled($data['store'] ?? null), fn ($offers) => $offers->filter(fn ($offer) => str_contains(mb_strtolower((string) $offer['price']->store?->name), mb_strtolower($data['store']))))
            ->sortBy('per_base')
            ->values();

        return Response::structured([
            'product' => $item->name,
            'compared_per' => UnitConverter::comparisonLabel($item->base_unit),
            'offers' => $offers->map(fn ($offer, $index) => [
                'cheapest' => $index === 0,
                'variant' => $offer['variant']->label($item->base_unit),
                'store' => $offer['price']->store?->name,
                'price' => (float) $offer['price']->amount,
                'price_per_base' => round($offer['per_base'], 2),
                'price_per_piece' => $offer['variant']->pricePerPiece($offer['price']),
                'date' => $offer['price']->observed_on->toDateString(),
                'source' => $offer['price']->source,
                'verified' => $offer['price']->isVerified(),
                'stale' => $offer['price']->isStale(),
            ])->all(),
            'pending_variants' => $item->variants->reject->isComparable()->map(fn ($variant) => $variant->label($item->base_unit))->values()->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'item_id' => $schema->string()->description('Identificador (UUID) del producto. Alternativa a "name".'),
            'name' => $schema->string()->description('Nombre o alias del producto. Alternativa a "item_id".'),
            'store' => $schema->string()->description('Filtra por tienda (coincidencia parcial).'),
        ];
    }
}
