<?php

namespace App\Mcp\Tools\Meal;

use App\Mcp\Tools\Meal\Concerns\InteractsWithMeals;
use App\Mcp\Tools\Meal\Concerns\UsesMealInventory;
use App\Services\Meal\MealInventory;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Planea una comida con recetas, elementos libres con ingredientes de inventario o preparaciones cocinadas. No registra consumo ni descuenta ingredientes. append agrega y suma porciones de recetas repetidas; replace sustituye solo esta casilla. Para registrar lo que comió usa consume-meal-tool. Reutiliza operation_key en reintentos.')]
class PlanMealTool extends Tool
{
    use InteractsWithMeals, UsesMealInventory;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate(['date' => ['nullable', 'date'], 'meal_type' => ['required', 'string'], 'items' => ['required', 'array'],
            'notes' => ['nullable', 'string'], 'calories' => ['nullable', 'integer'], 'mode' => ['nullable', 'string'], 'operation_key' => ['nullable', 'string', 'max:100']]);
        foreach ($data['items'] as &$item) {
            if (filled($item['recipe'] ?? null) && blank($item['recipe_id'] ?? null)) {
                $recipe = $this->resolveRecipe(null, $item['recipe']);
                if ($recipe instanceof Response) {
                    return $recipe;
                }
                $item['recipe_id'] = $recipe->id;
            }
        }
        unset($item);
        $key = $data['operation_key'] ?? null;
        unset($data['operation_key']);
        $data['date'] ??= today()->toDateString();

        try {
            $inventory = app(MealInventory::class);
            $userId = (int) auth()->id();
            $result = $inventory->plan($userId, $data, $key);
            $entry = $inventory->entry($userId, $result['meal_id']);
            return Response::structured($result + ['meal_type' => $entry->meal_type, 'date' => $entry->date->toDateString(), 'items' => $entry->items->map(fn ($item) => $item->recipe?->name ?? $item->name)->all(), 'calories' => $entry->effective_calories, 'summary' => 'Calorías estimadas: '.$entry->effective_calories.' kcal']);
        } catch (\Illuminate\Validation\ValidationException $exception) {
            return Response::error(implode(' ', $exception->validator->errors()->all()));
        }
    }

    public function schema(JsonSchema $schema): array
    {
        return ['date' => $schema->string()->description('YYYY-MM-DD; por defecto hoy.'),
            'meal_type' => $schema->string()->enum(MealInventory::TYPES)->required(), 'items' => $this->itemsSchema($schema)->required(),
            'notes' => $schema->string(), 'calories' => $schema->integer(), 'mode' => $schema->string()->enum(['append', 'replace']),
            'operation_key' => $schema->string()->description('UUID estable para reintentos de la misma operación.')];
    }
}
