<?php

namespace App\Mcp\Tools\Health;

use App\Models\HealthEvent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Corrige un evento de salud existente: título, notas, fecha, zonas del cuerpo o si es sensible. Solo cambia los campos enviados. Para registrar evolución usa log-health-follow-up-tool y para cerrar un malestar mark-health-recovery-tool.')]
class UpdateHealthEventTool extends Tool
{
    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'health_event_id' => ['required', 'string'],
            'title' => ['nullable', 'string', 'max:160'],
            'event_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:4000'],
            'append_notes' => ['nullable', 'string', 'max:2000'],
            'body_areas' => ['nullable', 'string', 'max:500'],
            'is_sensitive' => ['nullable', 'boolean'],
        ]);

        $event = Auth::user()->healthEvents()->find($data['health_event_id']);

        if (! $event) {
            return Response::error('No se encontró el evento de salud o no te pertenece.');
        }

        $changes = [];

        if (filled($data['title'] ?? null)) {
            $changes['title'] = trim($data['title']);
        }

        if (filled($data['event_date'] ?? null)) {
            if ($event->end_date && $data['event_date'] > $event->end_date->toDateString()) {
                return Response::error('La fecha no puede ser posterior a la de recuperación ('.$event->end_date->toDateString().').');
            }
            $changes['event_date'] = $data['event_date'];
        }

        if (array_key_exists('notes', $data) && $data['notes'] !== null) {
            $changes['notes'] = trim($data['notes']) ?: null;
        }

        if (filled($data['append_notes'] ?? null)) {
            $base = $changes['notes'] ?? $event->notes;
            $changes['notes'] = trim(($base ? $base."\n\n" : '').trim($data['append_notes']));
        }

        if (array_key_exists('is_sensitive', $data) && $data['is_sensitive'] !== null) {
            $changes['is_sensitive'] = (bool) $data['is_sensitive'];
        }

        if (array_key_exists('body_areas', $data) && $data['body_areas'] !== null) {
            if (! in_array($event->type, HealthEvent::BODY_AREA_TYPES, true)) {
                return Response::error('Solo los síntomas, enfermedades y procedimientos admiten zonas del cuerpo.');
            }

            $areas = array_values(array_unique(array_filter(array_map('trim', explode(',', $data['body_areas'])))));
            if ($unknown = array_diff($areas, array_keys(HealthEvent::BODY_AREAS))) {
                return Response::error('Zonas del cuerpo desconocidas: '.implode(', ', $unknown).'. Usa: '.implode(', ', array_keys(HealthEvent::BODY_AREAS)).'.');
            }

            $details = $event->details ?? [];
            unset($details['body_area']);
            $details['body_areas'] = $areas ?: null;
            $changes['details'] = array_filter($details, fn ($value) => $value !== null && $value !== '') ?: null;
        }

        if ($changes === []) {
            return Response::error('No enviaste ningún cambio.');
        }

        $event->update($changes);

        return Response::text("Evento de salud actualizado: \"{$event->title}\" (".implode(', ', array_keys($changes))."), id: {$event->id}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'health_event_id' => $schema->string()
                ->description('Id del evento de salud.')
                ->required(),
            'title' => $schema->string()->description('Nuevo título.'),
            'event_date' => $schema->string()->description('Nueva fecha del evento (YYYY-MM-DD).'),
            'notes' => $schema->string()->description('Reemplaza las notas completas. Envía "" para borrarlas.'),
            'append_notes' => $schema->string()->description('Agrega este texto al final de las notas, sin borrar lo anterior.'),
            'body_areas' => $schema->string()->description('Reemplaza las zonas del cuerpo, separadas por comas. Claves: '.implode(', ', array_keys(HealthEvent::BODY_AREAS)).'.'),
            'is_sensitive' => $schema->boolean()->description('Marca o desmarca el evento como íntimo.'),
        ];
    }
}
