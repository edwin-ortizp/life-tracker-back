<?php

namespace App\Mcp\Tools\Shopping;

use App\Mcp\Tools\Shopping\Concerns\ResolvesShoppingItem;
use App\Models\ShoppingItem;
use App\Services\Meal\IngredientMergeService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Convierte un producto en variante de otro: «Aromática de manzanilla» pasa a ser la variante «manzanilla» de «Aromática». Mueve variantes con sus precios, stock, compras, recetas y alias, y elimina el producto origen. Sin confirm=true solo devuelve la vista previa (producto principal sugerido, sabor y qué se mueve) para que el usuario la apruebe; es irreversible.')]
class MergeIngredientTool extends Tool
{
    use ResolvesShoppingItem;

    public function handle(Request $request, IngredientMergeService $merger): Response
    {
        $data = $request->validate([
            'source_id' => ['nullable', 'string'],
            'source_name' => ['nullable', 'string'],
            'target_id' => ['nullable', 'string'],
            'target_name' => ['nullable', 'string'],
            'flavor' => ['nullable', 'string', 'max:60'],
            'keep_alias' => ['nullable', 'boolean'],
            'confirm' => ['nullable', 'boolean'],
        ]);

        $source = $this->resolveShoppingItem($data['source_id'] ?? null, $data['source_name'] ?? null);
        if ($source instanceof Response) {
            return $source;
        }

        if (filled($data['target_id'] ?? null) || filled($data['target_name'] ?? null)) {
            $target = $this->resolveShoppingItem($data['target_id'] ?? null, $data['target_name'] ?? null);
            if ($target instanceof Response) {
                return $target;
            }
        } else {
            $target = IngredientMergeService::suggestedTarget($source);
            if (! $target) {
                return Response::error("No encontré un producto principal para \"{$source->name}\" por su nombre. Indica target_id o target_name.");
            }
        }

        $flavor = array_key_exists('flavor', $data) ? (string) $data['flavor'] : IngredientMergeService::suggestedFlavor($source->name, $target->name);
        $keepAlias = $data['keep_alias'] ?? true;

        if (! ($data['confirm'] ?? false)) {
            return Response::json([
                'preview' => true,
                'source' => ['id' => $source->id, 'name' => $source->name],
                'target' => ['id' => $target->id, 'name' => $target->name],
                'flavor' => $flavor ?: null,
                'keep_alias' => $keepAlias,
                'moves' => $merger->preview($source),
                'next_purchase' => $source->next_purchase,
                'note' => 'Nada ha cambiado. Muestra esto al usuario y, si lo aprueba, vuelve a llamar con confirm=true.',
            ]);
        }

        try {
            $result = $merger->merge($source, $target, $flavor, $keepAlias);
        } catch (ValidationException $exception) {
            return Response::error(collect($exception->errors())->flatten()->implode(' '));
        }

        return Response::text("\"{$source->name}\" ahora es la variante".($flavor ? " «{$flavor}»" : '')." de \"{$result->name}\""
            .($keepAlias ? ", con su nombre como alias" : '').'. Se movieron sus variantes, precios, stock, compras y recetas.');
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'source_id' => $schema->string()->description('Id del producto que se convierte en variante (el que desaparece).'),
            'source_name' => $schema->string()->description('Nombre del producto origen, si no tienes el id.'),
            'target_id' => $schema->string()->description('Id del producto principal. Si se omite junto con target_name, se sugiere por el nombre.'),
            'target_name' => $schema->string()->description('Nombre del producto principal.'),
            'flavor' => $schema->string()->description('Sabor o tipo que distingue la variante (manzanilla, congelada, infantil). Por defecto, la diferencia entre los nombres.'),
            'keep_alias' => $schema->boolean()->description('Guarda el nombre del origen como alias del principal (por defecto true).'),
            'confirm' => $schema->boolean()->description('true ejecuta la conversión. Sin él solo devuelve la vista previa.'),
        ];
    }
}
