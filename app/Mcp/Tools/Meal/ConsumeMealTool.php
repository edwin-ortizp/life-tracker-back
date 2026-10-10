<?php

namespace App\Mcp\Tools\Meal;

use App\Mcp\Tools\Meal\Concerns\UsesMealInventory;
use App\Services\Meal\MealInventory;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra el consumo de una comida completa, descontando ingredientes o porciones preparadas una sola vez. mode=outside registra comida por fuera sin descuento y conserva el plan. action=revert devuelve los descuentos originales y restaura el plan. Una comida consumida debe revertirse antes de editarla.')]
class ConsumeMealTool extends Tool
{
    use UsesMealInventory;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate(['meal_id' => ['nullable', 'integer'], 'date' => ['required_without:meal_id', 'nullable', 'date'], 'meal_type' => ['required_without:meal_id', 'nullable', 'string'], 'action' => ['nullable', 'in:consume,revert'], 'mode' => ['nullable', 'in:home,outside'], 'consumed_at' => ['nullable', 'date'], 'notes' => ['nullable', 'string'], 'calories' => ['nullable', 'integer'], 'operation_key' => ['required', 'string', 'max:100']]);

        return $this->inventoryResponse(function (MealInventory $inventory, int $userId) use ($data) {
            if (($data['action'] ?? 'consume') === 'revert') {
                if (empty($data['meal_id'])) {
                    $inventory->fail('Indica meal_id para revertir un consumo.');
                }
                return $inventory->revert($userId, $data['meal_id'], $data['operation_key']);
            }
            return empty($data['meal_id'])
                ? $inventory->consumeAt($userId, array_intersect_key($data, array_flip(['date', 'meal_type', 'mode', 'consumed_at', 'notes', 'calories'])), $data['operation_key'])
                : $inventory->consume($userId, $data['meal_id'], array_intersect_key($data, array_flip(['mode', 'consumed_at', 'notes', 'calories'])), $data['operation_key']);
        });
    }

    public function schema(JsonSchema $schema): array
    {
        return ['meal_id' => $schema->integer(), 'date' => $schema->string()->description('Alternativa al id para consumo por fuera sin plan.'), 'meal_type' => $schema->string()->enum(MealInventory::TYPES), 'action' => $schema->string()->enum(['consume', 'revert']), 'mode' => $schema->string()->enum(['home', 'outside']),
            'consumed_at' => $schema->string()->description('Fecha y hora efectiva. Por defecto ahora.'), 'notes' => $schema->string(), 'calories' => $schema->integer()->description('Total consumido; fuera de casa no se infiere del plan.'),
            'operation_key' => $schema->string()->description('UUID estable; reutilizar ante doble envío.')->required()];
    }
}
