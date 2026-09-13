<?php

namespace App\Mcp\Tools\Relationship;

use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use App\Models\RelationshipContactMethod;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Quita un medio de contacto (teléfono, correo, red social…) de un contacto, por su id o por su valor.')]
class RemoveContactMethodTool extends Tool
{
    use ResolvesContact;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'contact_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'method_id' => ['nullable', 'string'],
            'value' => ['nullable', 'string', 'required_without:method_id'],
        ]);

        $relationship = $this->resolveContact($data['contact_id'] ?? null, $data['name'] ?? null);
        if ($relationship instanceof Response) {
            return $relationship;
        }

        $method = ! empty($data['method_id'])
            ? $relationship->contactMethods()->whereKey($data['method_id'])->first()
            : $this->findByValue($relationship->contactMethods(), $data['value']);

        if (! $method) {
            return Response::error("No encontré ese medio de contacto en {$relationship->displayName()}. Usa list-contacts-tool para ver sus medios registrados.");
        }

        $label = "{$method->typeLabel()} {$method->value}";
        $method->delete();

        return Response::text("Medio de contacto eliminado de {$relationship->displayName()}: {$label}.");
    }

    /** Exact match first; a phone typed without its country code still matches by its ending. */
    private function findByValue(HasMany $methods, string $value): ?RelationshipContactMethod
    {
        $normalized = RelationshipContactMethod::normalize($value);

        return (clone $methods)->where('value_normalized', $normalized)->first()
            ?? (mb_strlen($normalized) >= 7 ? (clone $methods)->where('value_normalized', 'like', '%'.$normalized)->first() : null);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'contact_id' => $schema->string()
                ->description('Identificador (UUID) del contacto. Alternativa a "name".'),
            'name' => $schema->string()
                ->description('Nombre, apodo o alias del contacto. Alternativa a "contact_id".'),
            'method_id' => $schema->string()
                ->description('Id del medio de contacto a quitar.'),
            'value' => $schema->string()
                ->description('Valor a quitar (número, correo o usuario), si no se conoce el id.'),
        ];
    }
}
