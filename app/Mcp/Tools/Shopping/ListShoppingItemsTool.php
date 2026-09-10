<?php

namespace App\Mcp\Tools\Shopping;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los ítems de la lista de compras del usuario autenticado (pendientes por comprar), con sus precios por tienda.')]
class ListShoppingItemsTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'name' => ['nullable', 'string'],
            'only_pending' => ['nullable', 'boolean'],
        ]);

        $query = Auth::user()->shoppingItems()->with('variants');

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
                'quantity' => $item->to_buy,
                'unit' => $item->unit,
                'category' => $item->category,
                'stores' => $item->variants->map(fn ($variant) => [
                    'place' => $variant->place,
                    'price' => $variant->price,
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
