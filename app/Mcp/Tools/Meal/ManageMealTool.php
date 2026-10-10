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

#[Description('Edita, mueve, copia, intercambia o borra una comida planeada. edit envía el conjunto completo de componentes con sus ids existentes. move agrega al destino ocupado; swap intercambia ambas casillas; copy valida reservas nuevas. Nunca modifica otras comidas del día ni permite cambiar una comida consumida.')]
class ManageMealTool extends Tool
{
    use UsesMealInventory;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate(['meal_id' => ['required', 'integer'], 'action' => ['required', 'in:edit,move,copy,swap,delete'], 'date' => ['nullable', 'date'], 'meal_type' => ['nullable', 'string'], 'items' => ['nullable', 'array'], 'notes' => ['nullable', 'string'], 'calories' => ['nullable', 'integer'], 'operation_key' => ['required', 'string', 'max:100']]);

        return $this->inventoryResponse(function (MealInventory $inventory, int $userId) use ($data) {
            if ($data['action'] !== 'edit') {
                return $inventory->rearrange($userId, $data['meal_id'], $data['action'], array_intersect_key($data, array_flip(['date', 'meal_type'])), $data['operation_key']);
            }
            $entry = $inventory->entry($userId, $data['meal_id']);

            return $inventory->plan($userId, ['entry_id' => $entry->id, 'date' => $entry->date->toDateString(), 'meal_type' => $entry->meal_type, 'mode' => 'replace',
                'items' => $data['items'] ?? [], 'notes' => $data['notes'] ?? $entry->notes, 'calories' => array_key_exists('calories', $data) ? $data['calories'] : $entry->calories], $data['operation_key']);
        });
    }

    public function schema(JsonSchema $schema): array
    {
        return ['meal_id' => $schema->integer()->required(), 'action' => $schema->string()->enum(['edit', 'move', 'copy', 'swap', 'delete'])->required(),
            'date' => $schema->string()->description('Fecha destino para mover/copiar/intercambiar.'), 'meal_type' => $schema->string()->enum(MealInventory::TYPES)->description('Tipo destino.'),
            'items' => $this->itemsSchema($schema)->description('Conjunto completo al editar. Usa recipe_id, no nombre de receta.'), 'notes' => $schema->string(), 'calories' => $schema->integer(),
            'operation_key' => $schema->string()->required()];
    }
}
