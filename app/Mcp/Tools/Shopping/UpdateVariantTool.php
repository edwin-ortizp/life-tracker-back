<?php

namespace App\Mcp\Tools\Shopping;

use App\Models\ShoppingItemVariant;
use App\Services\Meal\CatalogNames;
use App\Services\Meal\RecipeCalculator;
use App\Services\Meal\UnitConverter;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Edita una variante existente de un producto (marca, empaque, contenido, unidades por paquete, código de barras, calorías propias), la marca como preferida o la elimina junto con sus precios. Úsala para completar las variantes "pendientes" (sin contenido). Obtén el variant_id con list-shopping-items-tool o compare-product-prices-tool.')]
class UpdateVariantTool extends Tool
{
    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'variant_id' => ['required', 'string'],
            'delete' => ['nullable', 'boolean'],
            'brand' => ['sometimes', 'nullable', 'string', 'max:255'],
            'packaging' => ['sometimes', 'nullable', Rule::in(array_keys(ShoppingItemVariant::PACKAGINGS))],
            'content' => ['sometimes', 'nullable', 'numeric', 'gt:0'],
            'content_unit' => ['nullable', 'string', 'max:20'],
            'units_per_pack' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'barcode' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_preferred' => ['nullable', 'boolean'],
            'kcal' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'protein' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'carbs' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'fat' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ]);

        $variant = ShoppingItemVariant::with('shoppingItem')->where('user_id', Auth::id())->find($data['variant_id']);
        if (! $variant) {
            return Response::error('No se encontró la variante o no te pertenece.');
        }

        $product = $variant->shoppingItem;

        if ($data['delete'] ?? false) {
            $label = $variant->label();
            $variant->delete();
            app(RecipeCalculator::class)->refreshRecipesUsing($product);

            return Response::text("Variante \"{$label}\" de \"{$product->name}\" eliminada con sus precios.");
        }

        $updates = collect($data)->only(['packaging', 'units_per_pack', 'barcode', 'kcal', 'protein', 'carbs', 'fat'])->all();

        if (array_key_exists('brand', $data)) {
            $updates['brand_id'] = CatalogNames::brand($data['brand'])?->id;
        }

        if (array_key_exists('content', $data)) {
            if ($data['content'] !== null) {
                if (! $product->base_unit) {
                    return Response::error("\"{$product->name}\" no tiene unidad base; defínela primero con update-shopping-item-tool.");
                }
                $content = UnitConverter::toBase((float) $data['content'], $data['content_unit'] ?? null, $product->base_unit, $product->grams_per_piece);
                if ($content === null) {
                    return Response::error("No puedo convertir \"{$data['content_unit']}\" a {$product->base_unit}. Usa g, kg, libra, ml, L, unidades o docena.");
                }
                $updates['content'] = $content;
            } else {
                $updates['content'] = null;
            }
        }

        if (isset($data['is_preferred'])) {
            $updates['is_preferred'] = (bool) $data['is_preferred'];
        }

        if ($updates === []) {
            return Response::error('No se indicó ningún cambio para la variante.');
        }

        DB::transaction(function () use ($variant, $updates, $product) {
            // Solo una variante preferida por producto.
            if ($updates['is_preferred'] ?? false) {
                $product->variants()->whereKeyNot($variant->id)->update(['is_preferred' => false]);
            }
            $variant->update($updates);
        });

        app(RecipeCalculator::class)->refreshRecipesUsing($product);
        $variant->load('brand');

        return Response::text("Variante de \"{$product->name}\" actualizada: {$variant->label($product->base_unit)}"
            .($variant->isComparable() ? '.' : ' (sigue pendiente: falta el contenido).'));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'variant_id' => $schema->string()->description('Id de la variante a editar.')->required(),
            'delete' => $schema->boolean()->description('true elimina la variante y todos sus precios.'),
            'brand' => $schema->string()->description('Marca. Vacío o null la quita.'),
            'packaging' => $schema->string()->enum(array_keys(ShoppingItemVariant::PACKAGINGS))->description('Empaque.'),
            'content' => $schema->number()->description('Contenido del paquete, p. ej. 900. null lo borra (la variante vuelve a quedar pendiente).'),
            'content_unit' => $schema->string()->description('Unidad del contenido (g, kg, libra, ml, L, unidades, docena). Por defecto la unidad base del producto.'),
            'units_per_pack' => $schema->integer()->description('Unidades por paquete.'),
            'barcode' => $schema->string()->description('Código de barras.'),
            'is_preferred' => $schema->boolean()->description('Marca la variante como la preferida del producto (desmarca las demás).'),
            'kcal' => $schema->number()->description('Calorías propias de esta marca, si difieren del producto (por 100 g, 100 ml o unidad).'),
            'protein' => $schema->number()->description('Proteína propia (g).'),
            'carbs' => $schema->number()->description('Carbohidratos propios (g).'),
            'fat' => $schema->number()->description('Grasa propia (g).'),
        ];
    }
}
