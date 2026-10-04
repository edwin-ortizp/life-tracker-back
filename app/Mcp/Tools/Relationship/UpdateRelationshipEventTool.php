<?php

namespace App\Mcp\Tools\Relationship;

use App\Models\RelationshipEvent;
use App\Support\EventDate;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Corrige o archiva un evento de una persona (registrado con log-relationship-event-tool): título, categoría, fecha, notas, si es sensible o si está archivado. Solo cambia lo enviado. El id sale de list-relationship-events-tool.')]
class UpdateRelationshipEventTool extends Tool
{
    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'event_id' => ['required', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', Rule::in(array_keys(RelationshipEvent::CATEGORIES))],
            'date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'append_notes' => ['nullable', 'string', 'max:2000'],
            'is_sensitive' => ['nullable', 'boolean'],
            'archived' => ['nullable', 'boolean'],
        ]);

        $event = Auth::user()->relationshipEvents()->with('relationship')->find($data['event_id']);
        if (! $event) {
            return Response::error('No se encontró el evento o no te pertenece.');
        }

        $changes = [];
        if (filled($data['title'] ?? null)) {
            $changes['title'] = trim($data['title']);
        }
        if (filled($data['category'] ?? null)) {
            $changes['category'] = $data['category'];
        }
        if (filled($data['date'] ?? null)) {
            $changes = [...$changes, ...EventDate::day(Carbon::parse($data['date']))->toAttributes()];
        }
        if (array_key_exists('notes', $data) && $data['notes'] !== null) {
            $changes['notes'] = trim($data['notes']) ?: null;
        }
        if (filled($data['append_notes'] ?? null)) {
            $base = $changes['notes'] ?? $event->notes;
            $changes['notes'] = trim(($base ? $base."\n\n" : '').trim($data['append_notes']));
        }
        if (isset($data['is_sensitive'])) {
            $changes['is_sensitive'] = (bool) $data['is_sensitive'];
        }
        if (isset($data['archived'])) {
            $changes['is_archived'] = (bool) $data['archived'];
            $changes['archived_at'] = $data['archived'] ? now() : null;
        }

        if ($changes === []) {
            return Response::error('No enviaste ningún cambio.');
        }

        $event->update($changes);

        return Response::text("Evento de {$event->relationship?->displayName()} actualizado: \"{$event->title}\" (".implode(', ', array_keys($changes)).').');
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'event_id' => $schema->string()->description('Id del evento.')->required(),
            'title' => $schema->string()->description('Nuevo título.'),
            'category' => $schema->string()->enum(array_keys(RelationshipEvent::CATEGORIES))->description('Nueva categoría.'),
            'date' => $schema->string()->description('Nueva fecha (YYYY-MM-DD).'),
            'notes' => $schema->string()->description('Reemplaza las notas. "" las borra.'),
            'append_notes' => $schema->string()->description('Agrega texto al final de las notas.'),
            'is_sensitive' => $schema->boolean()->description('Marca o desmarca como sensible.'),
            'archived' => $schema->boolean()->description('true archiva el evento (deja de mostrarse); false lo restaura.'),
        ];
    }
}
