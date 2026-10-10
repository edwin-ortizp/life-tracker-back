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

#[Description('Registra un ticket completo con varias líneas, suma stock y guarda precios. Usa una operation_key UUID estable para evitar duplicados al reintentar.')]
class CreatePurchaseTool extends Tool
{
    use InteractsWithPurchases;

    public function handle(Request $request): ResponseFactory
    {
        return Response::structured($this->presentPurchase(app(PurchaseRecorder::class)->save($request->all())));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'store_id' => $schema->string()->required()->description('UUID de la tienda del catálogo.'),
            'operation_key' => $schema->string()->required()->description('UUID estable; reutilizar en reintentos de esta compra.'),
        ] + $this->purchaseSchema($schema);
    }
}
