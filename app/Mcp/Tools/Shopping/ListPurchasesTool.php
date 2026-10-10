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

#[Description('Lista el historial de compras, filtrado por fechas, tienda o producto, con paginación.')]
class ListPurchasesTool extends Tool
{
    use InteractsWithPurchases;

    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate(['from' => ['nullable', 'date'], 'to' => ['nullable', 'date', 'after_or_equal:from'], 'store_id' => ['nullable', 'uuid'], 'item_id' => ['nullable', 'uuid'], 'page' => ['nullable', 'integer', 'min:1']]);
        abort_unless(auth()->id(), 401);
        $query = Purchase::where('user_id', auth()->id())->with('lines', 'store');
        if (! empty($data['from'])) {
            $query->whereDate('purchased_at', '>=', $data['from']);
        }
        if (! empty($data['to'])) {
            $query->whereDate('purchased_at', '<=', $data['to']);
        }
        if (! empty($data['store_id'])) {
            $query->where('store_id', $data['store_id']);
        }
        if (! empty($data['item_id'])) {
            $query->whereHas('lines', fn ($q) => $q->where('shopping_item_id', $data['item_id']));
        }
        $page = $query->orderByDesc('purchased_at')->orderByDesc('id')->paginate(25, ['*'], 'page', $data['page'] ?? 1);

        return Response::structured(['purchases' => $page->getCollection()->map(fn ($purchase) => $this->presentPurchase($purchase))->all(), 'page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()]);
    }

    public function schema(JsonSchema $schema): array
    {
        return ['from' => $schema->string(), 'to' => $schema->string(), 'store_id' => $schema->string(), 'item_id' => $schema->string(), 'page' => $schema->integer()];
    }
}
