<?php

namespace App\Mcp\Tools\Shopping;

use App\Mcp\Tools\Shopping\Concerns\ResolvesShoppingItem;
use App\Mcp\Tools\Shopping\Concerns\ResolvesStore;
use App\Models\ShoppingItem;
use App\Services\Meal\PurchaseRecorder;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra que el usuario compró un producto: suma lo comprado al stock en casa (contenido de la variante × paquetes), lo saca de la lista de compras y, si se indica el precio pagado, lo guarda como precio de ticket verificado. Equivale a "Marcar comprado" en la app.')]
class MarkPurchasedTool extends Tool
{
    use ResolvesShoppingItem, ResolvesStore;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'item_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'variant_id' => ['nullable', 'string'],
            'packages' => ['nullable', 'numeric', 'gt:0'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'store' => ['nullable', 'string', 'max:255', 'required_with:amount_paid'],
        ]);

        $item = $this->resolveShoppingItem($data['item_id'] ?? null, $data['name'] ?? null);
        if ($item instanceof Response) {
            return $item;
        }

        $store = filled($data['store'] ?? null) ? $this->resolveStore($data['store']) : null;
        if ($store instanceof Response) {
            return $store;
        }

        $item = ShoppingItem::withOffers()->find($item->id);
        $variant = filled($data['variant_id'] ?? null)
            ? $item->variants->firstWhere('id', $data['variant_id'])
            : ($item->bestOffer()['variant'] ?? ($item->variants->count() === 1 ? $item->variants->first() : null));

        if (filled($data['variant_id'] ?? null) && ! $variant) {
            return Response::error("La variante no pertenece a \"{$item->name}\".");
        }
        if (isset($data['amount_paid']) && ! $variant) {
            return Response::error("\"{$item->name}\" tiene varias variantes; indica variant_id para guardar el precio pagado.");
        }

        $packages = (float) ($data['packages'] ?? max((float) $item->to_buy, 1));
        $result = app(PurchaseRecorder::class)->record($item, $variant, $packages, isset($data['amount_paid']) ? (float) $data['amount_paid'] : null, $store);

        $item->refresh();
        $text = "Compra registrada: {$item->name}";
        $text .= $result['stock_added'] > 0
            ? ', +'.$item->formatQuantity($result['stock_added']).' (stock: '.$item->formatQuantity($item->stock).')'
            : ' (stock sin cambios: la variante no tiene contenido)';
        $text .= $result['price'] ? '; precio pagado $'.number_format((float) $result['price']->amount, 0, ',', '.').' guardado' : '';

        return Response::text($text.'. Ya no está en la lista de compras.');
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'item_id' => $schema->string()->description('Id del producto. Alternativa a "name".'),
            'name' => $schema->string()->description('Nombre o alias del producto. Alternativa a "item_id".'),
            'variant_id' => $schema->string()->description('Variante comprada. Por defecto la preferida o la más barata.'),
            'packages' => $schema->number()->description('Paquetes comprados. Por defecto la cantidad que estaba por comprar (mínimo 1).'),
            'amount_paid' => $schema->number()->description('Precio pagado por paquete. Requiere "store".'),
            'store' => $schema->string()->description('Tienda donde se compró, del catálogo cerrado.'),
        ];
    }
}
