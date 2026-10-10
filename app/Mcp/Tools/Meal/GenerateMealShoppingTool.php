<?php

namespace App\Mcp\Tools\Meal;

use App\Mcp\Tools\Meal\Concerns\UsesMealInventory;
use App\Services\Meal\MealInventory;
use App\Services\Meal\MealNeeds;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Previsualiza ingredientes faltantes del plan pendiente descontando el stock una vez por producto. action=generate agrega los paquetes necesarios sin acumularlos en reintentos ni reducir compras manuales. Consulta primero preview y elige variantes comparables si no hay preferida. Excluye consumos y preparaciones ya cocinadas.')]
class GenerateMealShoppingTool extends Tool
{
    use UsesMealInventory;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate(['action' => ['nullable', 'in:preview,generate'], 'since' => ['nullable', 'date'], 'until' => ['nullable', 'date', 'after_or_equal:since'], 'variants' => ['nullable', 'array'], 'variants.*.shopping_item_id' => ['required', 'uuid'], 'variants.*.variant_id' => ['required', 'uuid'], 'operation_key' => ['required_if:action,generate', 'nullable', 'string', 'max:100']]);
        $since = $data['since'] ?? today()->startOfWeek()->toDateString();
        $until = $data['until'] ?? \Carbon\Carbon::parse($since)->endOfWeek()->toDateString();

        return $this->inventoryResponse(fn (MealInventory $inventory, int $userId) => ($data['action'] ?? 'preview') === 'preview'
            ? app(MealNeeds::class)->preview($userId, $since, $until)
            : $inventory->generateShopping($userId, $since, $until, collect($data['variants'] ?? [])->pluck('variant_id', 'shopping_item_id')->all(), $data['operation_key']));
    }

    public function schema(JsonSchema $schema): array
    {
        return ['action' => $schema->string()->enum(['preview', 'generate']), 'since' => $schema->string(), 'until' => $schema->string(),
            'variants' => $schema->array()->items($schema->object(['shopping_item_id' => $schema->string()->required(), 'variant_id' => $schema->string()->required()])), 'operation_key' => $schema->string()];
    }
}
