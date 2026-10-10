<?php

namespace App\Mcp\Tools\Shopping;

use App\Mcp\Tools\Shopping\Concerns\ResolvesStore;
use App\Models\Store;
use App\Services\Meal\CatalogNames;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Administra el catálogo cerrado de tiendas donde se registran precios: list (todas, con su número de precios), create, rename, merge (une una tienda duplicada en otra conservando sus precios) y delete (solo si no tiene precios). Crea una tienda solo cuando el usuario confirme que es nueva; antes revisa la lista.')]
class ManageStoreTool extends Tool
{
    use ResolvesStore;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['list', 'create', 'rename', 'merge', 'delete'])],
            'store' => ['nullable', 'string', 'max:255'],
            'new_name' => ['nullable', 'string', 'max:255'],
            'into' => ['nullable', 'string', 'max:255'],
            'confirm_similar' => ['nullable', 'boolean'],
        ]);

        if ($data['action'] === 'list') {
            return Response::structured([
                'stores' => Store::withCount('prices')->orderBy('name')->get()
                    ->map(fn (Store $store) => ['id' => $store->id, 'name' => $store->name, 'prices' => $store->prices_count])->all(),
            ]);
        }

        if ($data['action'] === 'create') {
            try {
                $store = CatalogNames::createStore($data['new_name'] ?? $data['store'] ?? '', (bool) ($data['confirm_similar'] ?? false));
            } catch (\InvalidArgumentException $e) {
                return Response::error($e->getMessage().(str_starts_with($e->getMessage(), 'Ya hay tiendas parecidas') ? ' Si el usuario confirma que es otra, repite con confirm_similar: true.' : ''));
            }

            return Response::text("Tienda \"{$store->name}\" agregada al catálogo.");
        }

        if (blank($data['store'] ?? null)) {
            return Response::error('Indica en "store" la tienda sobre la que actúas.');
        }

        $store = $this->resolveStore($data['store']);
        if ($store instanceof Response) {
            return $store;
        }

        if ($data['action'] === 'rename') {
            $name = trim((string) ($data['new_name'] ?? ''));
            $existing = CatalogNames::findStore($name);
            if ($name === '' || ($existing && ! $existing->is($store))) {
                return Response::error($name === '' ? 'Indica el nuevo nombre en "new_name".' : "Ya existe \"{$existing->name}\"; si son la misma tienda usa action \"merge\".");
            }
            $old = $store->name;
            $store->update(['name' => $name]);

            return Response::text("Tienda \"{$old}\" renombrada a \"{$store->name}\".");
        }

        if ($data['action'] === 'merge') {
            $target = blank($data['into'] ?? null) ? null : $this->resolveStore($data['into']);
            if (! $target) {
                return Response::error('Indica en "into" la tienda que se conserva.');
            }
            if ($target instanceof Response) {
                return $target;
            }
            if ($target->is($store)) {
                return Response::error('La tienda de origen y la de destino son la misma.');
            }
            $count = $store->prices()->count();
            $store->mergeInto($target);

            return Response::text("\"{$store->name}\" se unió a \"{$target->name}\": {$count} precios movidos.");
        }

        $count = $store->prices()->count();
        if ($count > 0) {
            return Response::error("\"{$store->name}\" tiene {$count} precios; únela a otra tienda con action \"merge\" en vez de eliminarla.");
        }
        if ($store->purchases()->exists()) {
            return Response::error('Esta tienda tiene compras registradas; únela a otra tienda en vez de eliminarla.');
        }
        $store->delete();

        return Response::text("Tienda \"{$store->name}\" eliminada del catálogo.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'action' => $schema->string()->enum(['list', 'create', 'rename', 'merge', 'delete'])->description('Operación sobre el catálogo de tiendas.')->required(),
            'store' => $schema->string()->description('Tienda existente sobre la que se actúa (rename, merge, delete). En create puede usarse en lugar de new_name.'),
            'new_name' => $schema->string()->description('Nombre de la tienda nueva (create) o nuevo nombre (rename).'),
            'into' => $schema->string()->description('Tienda que se conserva al unir (merge).'),
            'confirm_similar' => $schema->boolean()->description('Crear aunque exista una tienda de nombre parecido, solo si el usuario confirmó que es otra.'),
        ];
    }
}
