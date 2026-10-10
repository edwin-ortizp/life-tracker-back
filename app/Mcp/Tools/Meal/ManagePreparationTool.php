<?php

namespace App\Mcp\Tools\Meal;

use App\Mcp\Tools\Meal\Concerns\UsesMealInventory;
use App\Models\MealPreparation;
use App\Services\Meal\MealInventory;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Cocina porciones de una receta (action=cook), descontando ingredientes una sola vez; consulta preparaciones y saldos (list/detail); cancela y devuelve ingredientes únicamente si no hay consumos ni reservas (cancel). Para comer una preparación, enlaza preparation_id en plan-meal-tool y luego consume-meal-tool.')]
class ManagePreparationTool extends Tool
{
    use UsesMealInventory;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate(['action' => ['required', 'in:cook,list,detail,cancel'], 'preparation_id' => ['required_if:action,detail,cancel', 'nullable', 'uuid'], 'recipe_id' => ['required_if:action,cook', 'nullable', 'uuid'], 'portions' => ['required_if:action,cook', 'nullable', 'numeric'], 'cooked_at' => ['nullable', 'date'], 'consume_by' => ['nullable', 'date'], 'operation_key' => ['required_if:action,cook,cancel', 'nullable', 'string', 'max:100'], 'page' => ['nullable', 'integer', 'min:1']]);

        return $this->inventoryResponse(function (MealInventory $inventory, int $userId) use ($data) {
            if ($data['action'] === 'cook') {
                return $inventory->cook($userId, array_intersect_key($data, array_flip(['recipe_id', 'portions', 'cooked_at', 'consume_by'])), $data['operation_key']);
            }
            if ($data['action'] === 'cancel') {
                return $inventory->cancelPreparation($userId, $data['preparation_id'], $data['operation_key']);
            }
            $query = MealPreparation::where('user_id', $userId);
            if ($data['action'] === 'detail') {
                return ($query->find($data['preparation_id']) ?? $inventory->fail('Preparación no encontrada o ajena.'))->summary();
            }
            $page = $query->where('cancelled', false)->orderByDesc('cooked_at')->paginate(20, ['*'], 'page', $data['page'] ?? 1);

            return ['preparations' => $page->getCollection()->map->summary()->all(), 'page' => $page->currentPage(), 'total' => $page->total()];
        });
    }

    public function schema(JsonSchema $schema): array
    {
        return ['action' => $schema->string()->enum(['cook', 'list', 'detail', 'cancel'])->required(), 'preparation_id' => $schema->string(), 'recipe_id' => $schema->string(), 'portions' => $schema->number(),
            'cooked_at' => $schema->string(), 'consume_by' => $schema->string()->description('Fecha límite opcional. Solo avisos, sin bloqueo automático.'), 'operation_key' => $schema->string()->description('Requerida al cocinar/cancelar; reutilizar en reintentos.'), 'page' => $schema->integer()];
    }
}
