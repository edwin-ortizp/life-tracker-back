<?php

namespace App\Mcp\Tools\Shopping;

use App\Mcp\Tools\Shopping\Concerns\InteractsWithPurchases;
use App\Models\Purchase;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Consulta la cabecera, líneas e importes de una compra del usuario autenticado.')]
class GetPurchaseTool extends Tool
{
    use InteractsWithPurchases;

    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate(['purchase_id' => ['required', 'uuid']]);
        abort_unless(auth()->id(), 401);

        return Response::structured($this->presentPurchase(Purchase::where('user_id', auth()->id())->with('lines', 'store')->findOrFail($data['purchase_id'])));
    }

    public function schema(JsonSchema $schema): array
    {
        return ['purchase_id' => $schema->string()->required()];
    }
}
