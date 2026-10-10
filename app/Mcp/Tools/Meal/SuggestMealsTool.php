<?php

namespace App\Mcp\Tools\Meal;

use App\Mcp\Tools\Meal\Concerns\UsesMealInventory;
use App\Services\Meal\MealNeeds;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Consulta qué puedes cocinar con el stock actual para las porciones indicadas y qué productos o preparaciones están vencidos o por vencer. Prioriza recetas posibles que aprovechen productos próximos a vencer. No modifica inventario.')]
class SuggestMealsTool extends Tool
{
    use UsesMealInventory;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate(['portions' => ['nullable', 'numeric', 'min:0.01', 'max:999999'], 'days' => ['nullable', 'integer', 'min:0', 'max:365']]);

        return $this->inventoryResponse(fn () => app(MealNeeds::class)->suggestions((int) auth()->id(), $data['portions'] ?? 1, $data['days'] ?? 7));
    }

    public function schema(JsonSchema $schema): array
    {
        return ['portions' => $schema->number()->description('Porciones a cocinar, por defecto 1.'), 'days' => $schema->integer()->description('Horizonte de vencimiento, por defecto 7 días.')];
    }
}
