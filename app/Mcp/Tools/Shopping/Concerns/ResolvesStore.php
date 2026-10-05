<?php

namespace App\Mcp\Tools\Shopping\Concerns;

use App\Models\Store;
use App\Services\Meal\CatalogNames;
use Laravel\Mcp\Response;

/**
 * Las tiendas son un catálogo cerrado: las herramientas solo usan tiendas existentes
 * y, si no la encuentran, devuelven las parecidas para que se elija una o se cree con manage-store-tool.
 */
trait ResolvesStore
{
    protected function resolveStore(string $name): Store|Response
    {
        if ($store = CatalogNames::findStore($name)) {
            return $store;
        }

        $all = Store::orderBy('name')->pluck('name');
        $similar = CatalogNames::similar($name, $all);

        return Response::error("La tienda \"{$name}\" no está en el catálogo. "
            .($similar->isNotEmpty() ? '¿Es alguna de estas? '.$similar->implode(', ').'. ' : '')
            .($all->isNotEmpty() ? 'Tiendas disponibles: '.$all->implode(', ').'. ' : '')
            .'Si es una tienda nueva, créala primero con manage-store-tool (action "create").');
    }
}
