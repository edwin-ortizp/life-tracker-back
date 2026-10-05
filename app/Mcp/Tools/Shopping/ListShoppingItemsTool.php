<?php

namespace App\Mcp\Tools\Shopping;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los ítems pendientes de la lista de compras del usuario con sus precios por tienda. Úsala cuando hable de mercado, compras o antes de agregar un ítem, para no duplicarlo.')]
class ListShoppingItemsTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'name' => ['nullable', 'string'],
            'only_pending' => ['nullable', 'boolean'],
        ]);

        $query = Auth::user()->shoppingItems()->withOffers();

        if (($data['only_pending'] ?? true) !== false) {
            $query->where('next_purchase', true);
        }

        if (! empty($data['name'])) {
            $name = $data['name'];
            $query->where(fn ($q) => $q->where('name', 'like', "%{$name}%")->orWhereHas('aliases', fn ($a) => $a->where('alias', 'like', "%{$name}%")));
        }

        $items = $query->orderBy('name')->limit(100)->get();

        return Response::structured([
            'items' => $items->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'base_unit' => $item->base_unit,
                'quantity' => $item->to_buy,
                'stock' => $item->stock,
                'min_stock' => $item->min_stock,
                'category' => $item->category,
                'estimated_price' => $item->estimatedPrice(),
                'offers' => $item->offers()->map(fn ($offer) => [
                    'variant' => $offer['variant']->label($item->base_unit),
                    'store' => $offer['price']->store?->name,
                    'price' => (float) $offer['price']->amount,
                    'date' => $offer['price']->observed_on->toDateString(),
                    'source' => $offer['price']->source,
                    'verified' => $offer['price']->isVerified(),
                    'price_per_base' => $offer['per_base'] !== null ? round($offer['per_base'], 2) : null,
                ])->all(),
            ])->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()
                ->description('Filtra por nombre o alias del ítem.'),
            'only_pending' => $schema->boolean()
                ->description('Si es true (por defecto), solo muestra los pendientes de compra. Si es false, muestra todo el catálogo.'),
        ];
    }
}
