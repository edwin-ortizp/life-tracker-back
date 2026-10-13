<?php

namespace App\Mcp\Tools\Common;

use App\Models\UserCategory;
use App\Support\CategoryCatalog;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista o gestiona categorías personales de bebidas, ejercicios, ánimo, hábitos a evitar, contactos, eventos y mantenimiento. Solo dos niveles. Conserva las claves existentes; no elimina categorías con hijas o registros asociados.')]
class ManageCategoryCatalogTool extends Tool
{
    public function handle(Request $request): Response
    {
        abort_unless(auth()->check(), 401);
        $data = $request->validate([
            'domain' => ['required', Rule::in(array_keys(CategoryCatalog::DOMAINS))],
            'action' => ['required', Rule::in(['list', 'create', 'update', 'delete'])],
            'id' => ['required_if:action,update,delete', 'nullable', 'uuid'],
            'name' => ['required_if:action,create,update', 'nullable', 'string', 'max:100'],
            'parent_id' => ['nullable', 'uuid'],
        ]);
        $query = UserCategory::where('user_id', auth()->id())->where('domain', $data['domain']);
        if ($data['action'] === 'list') {
            return Response::text($query->with('parent')->orderBy('name')->get()->map(fn ($c) => [
                'id' => $c->id, 'key' => $c->key, 'name' => $c->name, 'parent_id' => $c->parent_id, 'path' => $c->path_label,
            ])->toJson(JSON_UNESCAPED_UNICODE));
        }
        $category = $data['action'] === 'create' ? new UserCategory([
            'user_id' => auth()->id(), 'domain' => $data['domain'], 'key' => 'cat_'.Str::uuid(),
        ]) : $query->findOrFail($data['id']);
        try {
            if ($data['action'] === 'delete') {
                $category->delete();
            } else {
                $category->name = $data['name'];
                if (array_key_exists('parent_id', $data)) {
                    $category->parent_id = $data['parent_id'];
                }
                $category->save();
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return Response::error($e->validator->errors()->first());
        }
        return Response::text($category->toJson(JSON_UNESCAPED_UNICODE));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'domain' => $schema->string()->enum(array_keys(CategoryCatalog::DOMAINS))->required(),
            'action' => $schema->string()->enum(['list', 'create', 'update', 'delete'])->required(),
            'id' => $schema->string()->description('UUID de la categoría para update/delete.'),
            'name' => $schema->string()->description('Nombre para create/update.'),
            'parent_id' => $schema->string()->nullable()->description('UUID de raíz; null para quitar el padre. Omitir conserva el padre actual.'),
        ];
    }
}
