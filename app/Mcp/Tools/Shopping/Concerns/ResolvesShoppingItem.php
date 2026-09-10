<?php

namespace App\Mcp\Tools\Shopping\Concerns;

use App\Models\ShoppingItem;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Response;

trait ResolvesShoppingItem
{
    /**
     * @return ShoppingItem|Response Returns a Response::error(...) when the item
     *                               cannot be uniquely identified.
     */
    protected function resolveShoppingItem(?string $itemId, ?string $name): ShoppingItem|Response
    {
        if ($itemId) {
            $item = Auth::user()->shoppingItems()->find($itemId);

            return $item ?? Response::error('No se encontró el ítem o no te pertenece.');
        }

        if (! $name) {
            return Response::error('Debes indicar item_id o name para identificar el ítem.');
        }

        $match = $this->findShoppingItemByName($name);
        if ($match instanceof Response || $match instanceof ShoppingItem) {
            return $match;
        }

        return Response::error("No encontré ningún ítem que coincida con \"{$name}\". Usa list_shopping_items para revisar tu lista.");
    }

    /**
     * @return ShoppingItem|Response|null Null when no item matches (caller may create one),
     *                                    a Response::error(...) when the name is ambiguous.
     */
    protected function findShoppingItemByName(string $name): ShoppingItem|Response|null
    {
        $matches = Auth::user()->shoppingItems()
            ->where(fn ($query) => $query
                ->where('name', 'like', "%{$name}%")
                ->orWhereHas('aliases', fn ($aliases) => $aliases->where('alias', 'like', "%{$name}%")))
            ->get();

        if ($matches->isEmpty()) {
            return null;
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (ShoppingItem $item) => "{$item->name} (id: {$item->id})")->implode(', ');

            return Response::error("Hay varios ítems que coinciden con \"{$name}\": {$list}. Especifica el item_id o un nombre más preciso.");
        }

        return $matches->first();
    }
}
