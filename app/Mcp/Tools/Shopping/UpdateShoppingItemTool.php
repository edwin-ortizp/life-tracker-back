<?php

namespace App\Mcp\Tools\Shopping;

use App\Mcp\Tools\Shopping\Concerns\RecordsVariantPrices;
use App\Mcp\Tools\Shopping\Concerns\ResolvesShoppingItem;
use App\Models\ShoppingItem;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Actualiza un producto del catálogo de compras: cantidad a comprar, categoría, stock, mínimo, nutrición, o registra una variante (marca, empaque, contenido) con su precio por tienda, fecha y fuente.')]
class UpdateShoppingItemTool extends Tool
{
    use RecordsVariantPrices, ResolvesShoppingItem;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'item_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'quantity' => ['sometimes', 'numeric', 'min:0'],
            'category' => ['sometimes', 'nullable', 'string', Rule::in(array_keys(ShoppingItem::CATEGORIES))],
            'stock' => ['sometimes', 'numeric', 'min:0'],
            'min_stock' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'grams_per_piece' => ['sometimes', 'nullable', 'numeric', 'gt:0'],
            'kcal' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'protein' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'carbs' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'fat' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            ...$this->variantPriceRules(),
        ]);

        $store = $this->priceStore($data);
        if ($store instanceof Response) {
            return $store;
        }

        $item = $this->resolveShoppingItem($data['item_id'] ?? null, $data['name'] ?? null);
        if ($item instanceof Response) {
            return $item;
        }

        $updates = collect($data)->only(['category', 'stock', 'min_stock', 'grams_per_piece', 'kcal', 'protein', 'carbs', 'fat'])->all();
        if (array_key_exists('quantity', $data)) {
            $updates['to_buy'] = $data['quantity'];
        }

        if (filled($data['base_unit'] ?? null)) {
            $baseUnit = $this->resolveBaseUnit($data['base_unit']);
            if (! $baseUnit) {
                return Response::error('base_unit debe ser g, ml o unit.');
            }
            if ($item->base_unit && $item->base_unit !== $baseUnit) {
                return Response::error("La unidad base de \"{$item->name}\" es {$item->base_unit} y no puede cambiar. Si hace falta, crea otro producto.");
            }
            $updates['base_unit'] = $baseUnit;
        }

        if ($updates !== []) {
            $item->update($updates);
        }

        $recorded = $this->recordVariantPrice($item->refresh(), $data, $store);

        if ($updates === [] && ! $recorded) {
            return Response::error('No se indicó ningún campo para actualizar.');
        }

        return Response::text("Ítem \"{$item->name}\" actualizado (id: {$item->id})".($recorded ? "; {$recorded}" : '').'.');
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'item_id' => $schema->string()
                ->description('Identificador (UUID) del ítem. Alternativa a "name".'),
            'name' => $schema->string()
                ->description('Nombre del ítem. Alternativa a "item_id".'),
            'quantity' => $schema->number()
                ->description('Nueva cantidad de paquetes a comprar.'),
            'category' => $schema->string()
                ->enum(array_keys(ShoppingItem::CATEGORIES))
                ->description('Nueva categoría.'),
            'stock' => $schema->number()->description('Stock en casa, en la unidad base del producto.'),
            'min_stock' => $schema->number()->description('Stock mínimo, en la unidad base.'),
            'grams_per_piece' => $schema->number()->description('Gramos por pieza para productos por peso que se cuentan por pieza.'),
            'kcal' => $schema->number()->description('Calorías por 100 g, por 100 ml o por unidad según la unidad base.'),
            'protein' => $schema->number()->description('Proteína (g) por 100 g, 100 ml o unidad.'),
            'carbs' => $schema->number()->description('Carbohidratos (g) por 100 g, 100 ml o unidad.'),
            'fat' => $schema->number()->description('Grasa (g) por 100 g, 100 ml o unidad.'),
            ...$this->variantPriceSchema($schema),
        ];
    }
}
