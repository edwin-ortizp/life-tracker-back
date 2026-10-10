<?php

namespace App\Mcp\Tools\Meal\Concerns;

use App\Services\Meal\MealInventory;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;

trait UsesMealInventory
{
    private function inventoryResponse(callable $callback): Response|ResponseFactory
    {
        try {
            return Response::structured($callback(app(MealInventory::class), (int) auth()->id()));
        } catch (ValidationException $exception) {
            return Response::error(implode(' ', $exception->validator->errors()->all()));
        }
    }

    private function itemsSchema(JsonSchema $schema)
    {
        return $schema->array()->items($schema->object([
            'id' => $schema->integer()->description('Id del componente existente al editar; omitir en componentes nuevos.'),
            'recipe_id' => $schema->string()->description('Id de receta guardada, excluyente con preparation_id.'),
            'recipe' => $schema->string()->description('Nombre de receta guardada, alternativa al id.'),
            'preparation_id' => $schema->string()->description('Id de preparación cocinada. Reserva sus porciones sin descontar ingredientes.'),
            'name' => $schema->string()->description('Nombre del elemento libre.'),
            'portions' => $schema->number()->description('Porciones de receta o preparación, por defecto 1.'),
            'calories' => $schema->integer()->description('Calorías del elemento libre.'),
            'ingredients' => $schema->array()->items($schema->object([
                'shopping_item_id' => $schema->string()->description('UUID del producto de inventario.')->required(),
                'quantity' => $schema->number()->description('Cantidad usada en este elemento completo.')->required(),
                'unit' => $schema->string()->description('g, kg, ml, L, unidades… Sin unidad se asume la base del producto.'),
            ]))->description('Ingredientes enlazados de un elemento libre; planificar no descuenta stock.'),
        ]));
    }
}
