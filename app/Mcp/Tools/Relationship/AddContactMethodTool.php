<?php

namespace App\Mcp\Tools\Relationship;

use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use App\Models\RelationshipContactMethod;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Agrega un medio de contacto a un contacto existente: teléfono, WhatsApp, correo, Instagram, Facebook, TikTok, LinkedIn, X, otra red, sitio web u otro. Un contacto puede tener varios del mismo tipo (por ejemplo dos teléfonos).')]
class AddContactMethodTool extends Tool
{
    use ResolvesContact;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'contact_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:'.implode(',', array_keys(RelationshipContactMethod::TYPES))],
            'value' => ['required', 'string', 'max:255'],
            'label' => ['nullable', 'string', 'max:60'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $relationship = $this->resolveContact($data['contact_id'] ?? null, $data['name'] ?? null);
        if ($relationship instanceof Response) {
            return $relationship;
        }

        $value = trim($data['value']);
        $existing = $relationship->contactMethods()
            ->where('value_normalized', RelationshipContactMethod::normalize($value))
            ->first();

        if ($existing) {
            if (! empty($data['is_primary']) && ! $existing->is_primary) {
                $existing->update(['is_primary' => true]);
            }

            return Response::text("{$relationship->displayName()} ya tenía registrado {$existing->typeLabel()}: {$existing->value} (id: {$existing->id}).");
        }

        $method = $relationship->contactMethods()->create([
            'type' => $data['type'],
            'label' => isset($data['label']) ? trim($data['label']) : null,
            'value' => $value,
            'is_primary' => (bool) ($data['is_primary'] ?? false),
            'sort_order' => (int) $relationship->contactMethods()->max('sort_order') + 1,
        ]);

        return Response::text("Medio de contacto agregado a {$relationship->displayName()}: {$method->typeLabel()} {$method->value}".($method->label ? " ({$method->label})" : '').($method->is_primary ? ', principal' : '').". (id: {$method->id})");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'contact_id' => $schema->string()
                ->description('Identificador (UUID) del contacto. Alternativa a "name".'),
            'name' => $schema->string()
                ->description('Nombre, apodo o alias del contacto. Alternativa a "contact_id".'),
            'type' => $schema->string()
                ->enum(array_keys(RelationshipContactMethod::TYPES))
                ->description('Tipo: phone, whatsapp, email, instagram, facebook, tiktok, linkedin, x, social (otra red), website u other.')
                ->required(),
            'value' => $schema->string()
                ->description('El número, correo, usuario (@usuario) o URL.')
                ->required(),
            'label' => $schema->string()
                ->description('Etiqueta opcional, por ejemplo "Personal", "Trabajo" o "Casa".'),
            'is_primary' => $schema->boolean()
                ->description('true si es el principal de su tipo.'),
        ];
    }
}
