<?php

namespace App\Mcp\Tools\Shopping;

use App\Models\ShoppingItemPrice;
use App\Mcp\Tools\Shopping\Concerns\ResolvesStore;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Gestiona un precio ya registrado: lo marca como verificado, corrige su valor, tienda, fecha o fuente, o lo elimina. Obtén el price_id con list-shopping-items-tool o compare-product-prices-tool. Para registrar un precio nuevo usa update-shopping-item-tool.')]
class ManagePriceTool extends Tool
{
    use ResolvesStore;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'price_id' => ['required', 'string'],
            'action' => ['required', Rule::in(['verify', 'update', 'delete'])],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'store' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
            'source' => ['nullable', Rule::in(array_keys(ShoppingItemPrice::SOURCES))],
            'verified' => ['nullable', 'boolean'],
        ]);

        $price = ShoppingItemPrice::with(['store', 'variant.shoppingItem'])->where('user_id', Auth::id())->find($data['price_id']);
        if (! $price) {
            return Response::error('No se encontró el precio o no te pertenece.');
        }

        $product = $price->variant?->shoppingItem?->name ?? 'producto';
        $describe = fn (ShoppingItemPrice $p) => '$'.number_format((float) $p->amount, 0, ',', '.').' en '.$p->store?->name.' ('.$p->observed_on->toDateString().', '.$p->source.($p->isVerified() ? ', verificado' : '').')';

        if ($data['action'] === 'delete') {
            $text = $describe($price);
            $price->delete();

            return Response::text("Precio de \"{$product}\" eliminado: {$text}.");
        }

        if ($data['action'] === 'verify') {
            $price->update(['verified_at' => now(), 'verified_by' => Auth::id()]);

            return Response::text("Precio de \"{$product}\" verificado: {$describe($price->refresh())}.");
        }

        $store = filled($data['store'] ?? null) ? $this->resolveStore($data['store']) : null;
        if ($store instanceof Response) {
            return $store;
        }

        $updates = array_filter([
            'amount' => $data['amount'] ?? null,
            'store_id' => $store?->id,
            'observed_on' => $data['date'] ?? null,
            'source' => $data['source'] ?? null,
        ], fn ($value) => $value !== null);

        if (isset($data['verified'])) {
            $updates += $data['verified']
                ? ['verified_at' => $price->verified_at ?? now(), 'verified_by' => $price->verified_by ?? Auth::id()]
                : ['verified_at' => null, 'verified_by' => null];
        }

        if ($updates === []) {
            return Response::error('Para action "update" indica amount, store, date, source o verified.');
        }

        $price->update($updates);

        return Response::text("Precio de \"{$product}\" actualizado: {$describe($price->refresh()->load('store'))}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'price_id' => $schema->string()->description('Id del precio.')->required(),
            'action' => $schema->string()->enum(['verify', 'update', 'delete'])->description('verify: marca verificado; update: corrige campos; delete: lo elimina.')->required(),
            'amount' => $schema->number()->description('Nuevo valor del paquete (update).'),
            'store' => $schema->string()->description('Nueva tienda del catálogo (update).'),
            'date' => $schema->string()->description('Nueva fecha YYYY-MM-DD (update).'),
            'source' => $schema->string()->enum(array_keys(ShoppingItemPrice::SOURCES))->description('Nueva fuente (update).'),
            'verified' => $schema->boolean()->description('Marca o desmarca como verificado (update).'),
        ];
    }
}
