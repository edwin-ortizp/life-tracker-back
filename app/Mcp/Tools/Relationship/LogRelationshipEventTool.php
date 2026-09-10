<?php

namespace App\Mcp\Tools\Relationship;

use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use App\Models\RelationshipEvent;
use App\Support\EventDate;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra un evento importante (hito, viaje, celebración, etc.) para un contacto del usuario autenticado.')]
class LogRelationshipEventTool extends Tool
{
    use ResolvesContact;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'contact_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in(array_keys(RelationshipEvent::CATEGORIES))],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'is_sensitive' => ['nullable', 'boolean'],
        ]);

        $relationship = $this->resolveContact($data['contact_id'] ?? null, $data['name'] ?? null);
        if ($relationship instanceof Response) {
            return $relationship;
        }

        $event = $relationship->relationshipEvents()->create([
            'title' => trim($data['title']),
            'category' => $data['category'],
            'notes' => $data['notes'] ?? null,
            'is_sensitive' => $data['is_sensitive'] ?? false,
            ...EventDate::day(Carbon::parse($data['date']))->toAttributes(),
        ]);

        return Response::text("Evento registrado para {$relationship->displayName()}: \"{$event->title}\" ({$event->categoryLabel()}), id: {$event->id}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'contact_id' => $schema->string()
                ->description('Identificador (UUID) del contacto. Alternativa a "name".'),
            'name' => $schema->string()
                ->description('Nombre o apodo del contacto. Alternativa a "contact_id".'),
            'title' => $schema->string()
                ->description('Título del evento.')
                ->required(),
            'category' => $schema->string()
                ->enum(array_keys(RelationshipEvent::CATEGORIES))
                ->description('Categoría del evento.')
                ->required(),
            'date' => $schema->string()
                ->description('Fecha del evento en formato YYYY-MM-DD.')
                ->required(),
            'notes' => $schema->string()
                ->description('Notas adicionales.'),
            'is_sensitive' => $schema->boolean()
                ->description('Si el evento es sensible y no debe mostrarse en vistas globales por defecto.'),
        ];
    }
}
