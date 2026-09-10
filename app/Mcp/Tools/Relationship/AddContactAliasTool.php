<?php

namespace App\Mcp\Tools\Relationship;

use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Añade un alias o apodo a un contacto existente, para que se le pueda reconocer por ese nombre en el futuro.')]
class AddContactAliasTool extends Tool
{
    use ResolvesContact;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'contact_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'alias' => ['required', 'string', 'max:120'],
        ]);

        $relationship = $this->resolveContact($data['contact_id'] ?? null, $data['name'] ?? null);
        if ($relationship instanceof Response) {
            return $relationship;
        }

        $alias = trim($data['alias']);

        $exists = $relationship->aliases()->whereRaw('LOWER(alias) = ?', [mb_strtolower($alias)])->exists();
        if ($exists) {
            return Response::text("\"{$alias}\" ya estaba registrado como alias de {$relationship->displayName()}.");
        }

        $relationship->aliases()->create(['alias' => $alias]);

        return Response::text("Alias \"{$alias}\" añadido a {$relationship->displayName()}. Ahora también se le reconocerá por ese nombre.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'contact_id' => $schema->string()
                ->description('Identificador (UUID) del contacto. Alternativa a "name".'),
            'name' => $schema->string()
                ->description('Nombre o apodo actual del contacto. Alternativa a "contact_id".'),
            'alias' => $schema->string()
                ->description('Nuevo alias o apodo a asociar con el contacto.')
                ->required(),
        ];
    }
}
