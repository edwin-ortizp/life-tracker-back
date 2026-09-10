<?php

namespace App\Mcp\Tools\Shopping;

use App\Mcp\Tools\Shopping\Concerns\ResolvesShoppingItem;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Quita un ítem de la lista de compras actual (lo marca como no pendiente de compra). No elimina el ítem del catálogo de ingredientes.')]
class RemoveShoppingItemTool extends Tool
{
    use ResolvesShoppingItem;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'item_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
        ]);

        $item = $this->resolveShoppingItem($data['item_id'] ?? null, $data['name'] ?? null);
        if ($item instanceof Response) {
            return $item;
        }

        $item->update(['next_purchase' => false]);

        return Response::text("\"{$item->name}\" se quitó de la lista de compras.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'item_id' => $schema->string()
                ->description('Identificador (UUID) del ítem. Alternativa a "name".'),
            'name' => $schema->string()
                ->description('Nombre del ítem. Alternativa a "item_id".'),
        ];
    }
}
