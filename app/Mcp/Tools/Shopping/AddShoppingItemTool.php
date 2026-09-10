<?php

namespace App\Mcp\Tools\Shopping;

use App\Mcp\Tools\Shopping\Concerns\ResolvesShoppingItem;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Añade un ítem a la lista de compras del usuario autenticado. Si el ítem ya existe en el catálogo lo agrega a la lista y opcionalmente actualiza su cantidad; si no existe, lo crea.')]
class AddShoppingItemTool extends Tool
{
    use ResolvesShoppingItem;

    private const CATEGORIES = [
        'frutas_verduras', 'carnes', 'lacteos', 'panaderia', 'cereales', 'enlatados',
        'condimentos', 'bebidas', 'congelados', 'snacks', 'limpieza', 'higiene', 'mascotas', 'otros',
    ];

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'item_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'unit' => ['nullable', 'string', 'max:60'],
            'category' => ['nullable', 'string', Rule::in(self::CATEGORIES)],
            'store' => ['nullable', 'string', 'max:255', 'required_with:price'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if (empty($data['item_id']) && empty($data['name'])) {
            return Response::error('Debes indicar item_id o name para identificar el ítem.');
        }

        $item = null;
        $created = false;

        if (! empty($data['item_id'])) {
            $item = Auth::user()->shoppingItems()->find($data['item_id']);
            if (! $item) {
                return Response::error('No se encontró el ítem o no te pertenece.');
            }
        } else {
            $match = $this->findShoppingItemByName($data['name']);
            if ($match instanceof Response) {
                return $match;
            }
            $item = $match;
        }

        if ($item) {
            $updates = ['next_purchase' => true];
            if (isset($data['quantity'])) {
                $updates['to_buy'] = $data['quantity'];
            }
            if (isset($data['unit'])) {
                $updates['unit'] = $data['unit'];
            }
            if (isset($data['category'])) {
                $updates['category'] = $data['category'];
            }
            $item->update($updates);
        } else {
            $item = Auth::user()->shoppingItems()->create([
                'name' => trim($data['name']),
                'stock' => 0,
                'to_buy' => $data['quantity'] ?? 1,
                'unit' => $data['unit'] ?? null,
                'category' => $data['category'] ?? null,
                'status' => 'available',
                'next_purchase' => true,
            ]);
            $created = true;
        }

        if (! empty($data['store'])) {
            $variant = $item->variants()->where('place', $data['store'])->first();
            $variantAttributes = array_filter([
                'price' => $data['price'] ?? null,
                'notes' => $data['notes'] ?? null,
            ], fn ($value) => $value !== null);

            if ($variant) {
                $variant->update($variantAttributes);
            } else {
                $item->variants()->create(['place' => $data['store'], ...$variantAttributes]);
            }
        }

        $verb = $created ? 'creado y añadido' : 'añadido';

        return Response::text("Ítem \"{$item->name}\" {$verb} a la lista de compras (id: {$item->id}).");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'item_id' => $schema->string()
                ->description('Identificador (UUID) de un ítem ya existente en el catálogo. Alternativa a "name".'),
            'name' => $schema->string()
                ->description('Nombre del ítem. Alternativa a "item_id". Si ya existe un ítem con ese nombre, se reutiliza en vez de crear uno duplicado.'),
            'quantity' => $schema->integer()
                ->description('Cantidad a comprar.'),
            'unit' => $schema->string()
                ->description('Unidad (kg, unidades, litros, etc.).'),
            'category' => $schema->string()
                ->enum(self::CATEGORIES)
                ->description('Categoría del ítem.'),
            'store' => $schema->string()
                ->description('Tienda donde se consigue, para registrar o actualizar su precio en ese lugar.'),
            'price' => $schema->number()
                ->description('Precio en la tienda indicada. Requiere "store".'),
            'notes' => $schema->string()
                ->description('Notas sobre esa tienda/presentación.'),
        ];
    }
}
