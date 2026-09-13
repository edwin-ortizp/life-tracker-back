<?php

namespace App\Mcp\Tools\Health;

use App\Models\HealthEvent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra un evento de salud (cita, chequeo, procedimiento, síntoma, enfermedad o vacuna) para el usuario autenticado.')]
class LogHealthEventTool extends Tool
{
    /** Tipos que exigen intensidad inicial (el procedimiento la admite de forma opcional). */
    private const INTENSITY_REQUIRED_TYPES = ['symptom', 'illness'];

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'type' => ['required', 'string', Rule::in(array_keys(HealthEvent::TYPES))],
            'title' => ['required', 'string', 'max:160'],
            'event_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:4000'],
            'initial_intensity' => ['nullable', 'integer', 'between:1,10'],
            'body_areas' => ['nullable', 'string', 'max:500'],
            'provider' => ['nullable', 'string', 'max:120'],
            'facility' => ['nullable', 'string', 'max:120'],
        ]);

        $areas = array_values(array_unique(array_filter(array_map('trim', explode(',', $data['body_areas'] ?? '')))));
        if ($unknown = array_diff($areas, array_keys(HealthEvent::BODY_AREAS))) {
            return Response::error('Zonas del cuerpo desconocidas: '.implode(', ', $unknown).'. Usa: '.implode(', ', array_keys(HealthEvent::BODY_AREAS)).'.');
        }

        $tracksEvolution = in_array($data['type'], HealthEvent::EVOLUTION_TYPES, true);

        if (in_array($data['type'], self::INTENSITY_REQUIRED_TYPES, true) && ! isset($data['initial_intensity'])) {
            return Response::error('Los eventos de tipo "symptom" o "illness" requieren "initial_intensity" (1-10).');
        }

        $event = Auth::user()->healthEvents()->create([
            'type' => $data['type'],
            'title' => trim($data['title']),
            'event_date' => $data['event_date'],
            'notes' => $data['notes'] ?? null,
            'details' => array_filter([
                'body_areas' => in_array($data['type'], HealthEvent::BODY_AREA_TYPES, true) && $areas !== [] ? $areas : null,
                'provider' => trim($data['provider'] ?? '') ?: null,
                'facility' => trim($data['facility'] ?? '') ?: null,
            ]) ?: null,
        ]);

        if ($tracksEvolution && isset($data['initial_intensity']) && ! $event->event_date->isFuture()) {
            $event->logs()->create([
                'date' => $event->event_date,
                'intensity' => $data['initial_intensity'],
            ]);
        }

        return Response::text("Evento de salud registrado: \"{$event->title}\" ({$event->type}), id: {$event->id}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'type' => $schema->string()
                ->enum(array_keys(HealthEvent::TYPES))
                ->description('Tipo de evento de salud.')
                ->required(),
            'title' => $schema->string()
                ->description('Título del evento.')
                ->required(),
            'event_date' => $schema->string()
                ->description('Fecha del evento en formato YYYY-MM-DD.')
                ->required(),
            'notes' => $schema->string()
                ->description('Notas adicionales.'),
            'initial_intensity' => $schema->integer()
                ->description('Intensidad inicial (1-10). Requerido si el tipo es "symptom" o "illness"; opcional para "procedure" (molestia de la recuperación).'),
            'body_areas' => $schema->string()
                ->description('Zonas del cuerpo separadas por comas para "symptom", "illness" o "procedure" (p. ej. "head,mouth_throat"). Claves: '.implode(', ', array_keys(HealthEvent::BODY_AREAS)).'.'),
            'provider' => $schema->string()
                ->description('Profesional o cirujano (citas, chequeos y procedimientos).'),
            'facility' => $schema->string()
                ->description('Centro o clínica (citas, chequeos y procedimientos).'),
        ];
    }
}
