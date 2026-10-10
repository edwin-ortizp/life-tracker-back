<?php

namespace App\Mcp\Tools\Shopping;

use App\Mcp\Tools\Shopping\Concerns\InteractsWithPurchases;
use App\Services\Meal\PurchaseRecorder;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Edita una compra enviando cabecera y TODAS sus líneas; identifica las existentes por id. Recalcula diferencias de stock y precios; rechaza stock negativo.')]
class UpdatePurchaseTool extends Tool
{
    use InteractsWithPurchases;

    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate(['purchase_id' => ['required', 'uuid']]);

        return Response::structured($this->presentPurchase(app(PurchaseRecorder::class)->save($request->all(), $data['purchase_id'])));
    }

    public function schema(JsonSchema $schema): array
    {
        return ['purchase_id' => $schema->string()->required()] + $this->purchaseSchema($schema);
    }
}
