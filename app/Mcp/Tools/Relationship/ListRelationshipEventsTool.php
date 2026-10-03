<?php

namespace App\Mcp\Tools\Relationship;

use App\Mcp\Support\McpOutput;
use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use App\Models\RelationshipEvent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Historial de eventos importantes de las personas del usuario (hitos, salud, trabajo, viajes, conversaciones, celebraciones), de una persona o de todas. Úsala para saber qué ha pasado en la vida de alguien o en la relación. Los eventos sensibles se omiten salvo include_sensitive=true. Más reciente primero.')]
class ListRelationshipEventsTool extends Tool
{
    use ResolvesContact;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            'contact_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'category' => ['nullable', 'string', Rule::in(array_keys(RelationshipEvent::CATEGORIES))],
            'search' => ['nullable', 'string', 'max:120'],
            'since' => ['nullable', 'date'],
            'until' => ['nullable', 'date'],
            'include_sensitive' => ['nullable', 'boolean'],
            'include_archived' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $contact = null;
        if (filled($data['contact_id'] ?? null) || filled($data['name'] ?? null)) {
            $contact = $this->resolveContact($data['contact_id'] ?? null, $data['name'] ?? null);
            if ($contact instanceof Response) {
                return $contact;
            }
        }

        $includeSensitive = (bool) ($data['include_sensitive'] ?? false);

        $query = Auth::user()->relationshipEvents()
            ->with('relationship')
            ->whereHas('relationship')
            ->when($contact, fn ($query) => $query->where('relationship_id', $contact->id))
            ->when(empty($data['include_archived']), fn ($query) => $query->active())
            ->when(filled($data['category'] ?? null), fn ($query) => $query->where('category', $data['category']))
            ->when(filled($data['search'] ?? null), function ($query) use ($data) {
                $like = '%'.addcslashes(trim($data['search']), '%_').'%';
                $query->where(fn ($match) => $match->where('title', 'like', $like)->orWhere('notes', 'like', $like));
            })
            // Los eventos antiguos solo tienen event_date; los nuevos, una ventana starts_on/ends_on.
            ->when(filled($data['since'] ?? null), fn ($query) => $query->where(fn ($window) => $window
                ->whereDate('ends_on', '>=', $data['since'])
                ->orWhere(fn ($legacy) => $legacy->whereNull('ends_on')->whereDate('event_date', '>=', $data['since']))))
            ->when(filled($data['until'] ?? null), fn ($query) => $query->where(fn ($window) => $window
                ->whereDate('starts_on', '<=', $data['until'])
                ->orWhere(fn ($legacy) => $legacy->whereNull('starts_on')->whereDate('event_date', '<=', $data['until']))));

        $hidden = $includeSensitive ? 0 : (clone $query)->where('is_sensitive', true)->count();

        $events = $query->visibleGlobally($includeSensitive)
            ->chronological('desc')
            ->limit($data['limit'] ?? 30)
            ->get();

        return Response::structured(McpOutput::compact([
            'events' => $events->map(fn (RelationshipEvent $event) => [
                'id' => $event->id,
                'contact' => $event->relationship->displayName(),
                'contact_id' => $contact ? null : $event->relationship_id,
                'title' => $event->title,
                'category' => $event->category,
                'date' => $event->dateLabel(),
                'starts_on' => $event->starts_on?->toDateString(),
                'notes' => $event->notes,
                'is_sensitive' => $event->is_sensitive ? true : null,
            ])->all(),
            'hidden_sensitive' => $hidden ?: null,
        ]));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'contact_id' => $schema->string()->description('Id de la persona. Alternativa a "name".'),
            'name' => $schema->string()->description('Nombre, apodo o alias de la persona. Sin persona, lista los eventos de todos.'),
            'category' => $schema->string()->enum(array_keys(RelationshipEvent::CATEGORIES))->description('Filtra por categoría.'),
            'search' => $schema->string()->description('Texto en el título o las notas.'),
            'since' => $schema->string()->description('Desde esta fecha (YYYY-MM-DD).'),
            'until' => $schema->string()->description('Hasta esta fecha (YYYY-MM-DD).'),
            'include_sensitive' => $schema->boolean()->description('Incluye eventos sensibles. Úsalo solo si el tema actual los requiere.'),
            'include_archived' => $schema->boolean()->description('Incluye eventos archivados.'),
            'limit' => $schema->integer()->description('Máximo de eventos (por defecto 30, máximo 100).'),
        ];
    }
}
