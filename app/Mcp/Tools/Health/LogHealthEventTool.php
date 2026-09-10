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
    private const EVOLUTION_TYPES = ['symptom', 'illness'];

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'type' => ['required', 'string', Rule::in(array_keys(HealthEvent::TYPES))],
            'title' => ['required', 'string', 'max:160'],
            'event_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:4000'],
            'initial_intensity' => ['nullable', 'integer', 'between:1,10'],
        ]);

        $tracksEvolution = in_array($data['type'], self::EVOLUTION_TYPES, true);

        if ($tracksEvolution && ! isset($data['initial_intensity'])) {
            return Response::error('Los eventos de tipo "symptom" o "illness" requieren "initial_intensity" (1-10).');
        }

        $event = Auth::user()->healthEvents()->create([
            'type' => $data['type'],
            'title' => trim($data['title']),
            'event_date' => $data['event_date'],
            'notes' => $data['notes'] ?? null,
        ]);

        if ($tracksEvolution) {
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
                ->description('Intensidad inicial (1-10). Requerido si el tipo es "symptom" o "illness".'),
        ];
    }
}
