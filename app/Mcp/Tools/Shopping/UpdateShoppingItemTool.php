<?php

namespace App\Mcp\Tools\Shopping;

use App\Mcp\Tools\Shopping\Concerns\ResolvesShoppingItem;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Actualiza propiedades de un ítem de la lista de compras, como la cantidad, la unidad, la categoría, o el precio en una tienda.')]
class UpdateShoppingItemTool extends Tool
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
            'name' => ['nullable', 'string'],
            'quantity' => ['sometimes', 'integer', 'min:0'],
            'unit' => ['sometimes', 'nullable', 'string', 'max:60'],
            'category' => ['sometimes', 'nullable', 'string', Rule::in(self::CATEGORIES)],
            'store' => ['nullable', 'string', 'max:255', 'required_with:price'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $item = $this->resolveShoppingItem($data['item_id'] ?? null, $data['name'] ?? null);
        if ($item instanceof Response) {
            return $item;
        }

        $updates = [];
        if (array_key_exists('quantity', $data)) {
            $updates['to_buy'] = $data['quantity'];
        }
        if (array_key_exists('unit', $data)) {
            $updates['unit'] = $data['unit'];
        }
        if (array_key_exists('category', $data)) {
            $updates['category'] = $data['category'];
        }

        if ($updates !== []) {
            $item->update($updates);
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

        if ($updates === [] && empty($data['store'])) {
            return Response::error('No se indicó ningún campo para actualizar.');
        }

        return Response::text("Ítem \"{$item->name}\" actualizado (id: {$item->id}).");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'item_id' => $schema->string()
                ->description('Identificador (UUID) del ítem. Alternativa a "name".'),
            'name' => $schema->string()
                ->description('Nombre del ítem. Alternativa a "item_id".'),
            'quantity' => $schema->integer()
                ->description('Nueva cantidad a comprar.'),
            'unit' => $schema->string()
                ->description('Nueva unidad.'),
            'category' => $schema->string()
                ->enum(self::CATEGORIES)
                ->description('Nueva categoría.'),
            'store' => $schema->string()
                ->description('Tienda cuyo precio se va a registrar o actualizar.'),
            'price' => $schema->number()
                ->description('Nuevo precio en esa tienda. Requiere "store".'),
            'notes' => $schema->string()
                ->description('Notas sobre esa tienda/presentación.'),
        ];
    }
}
