<?php

namespace App\Mcp\Tools\Health;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Añade un registro de seguimiento (evolución de intensidad) a un evento de salud de tipo síntoma o enfermedad que aún no se ha marcado como recuperado.')]
class LogHealthFollowUpTool extends Tool
{
    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'health_event_id' => ['required', 'string'],
            'date' => ['required', 'date'],
            'intensity' => ['required', 'integer', 'between:1,10'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $event = Auth::user()->healthEvents()->find($data['health_event_id']);
        if (! $event) {
            return Response::error('No se encontró el evento de salud o no te pertenece.');
        }

        if (! in_array($event->type, ['symptom', 'illness'], true)) {
            return Response::error('Solo los eventos de tipo "symptom" o "illness" admiten seguimiento de evolución.');
        }

        if ($event->end_date) {
            return Response::error('Este malestar ya está marcado como recuperado, no admite más seguimiento.');
        }

        if ($data['date'] < $event->event_date->toDateString()) {
            return Response::error('La fecha no puede ser anterior al inicio del malestar.');
        }

        if ($event->logs()->whereDate('date', $data['date'])->exists()) {
            return Response::error('Ya hay una intensidad registrada para ese día.');
        }

        $event->logs()->create([
            'date' => $data['date'],
            'intensity' => $data['intensity'],
            'notes' => $data['notes'] ?? null,
        ]);

        return Response::text("Seguimiento registrado para \"{$event->title}\": intensidad {$data['intensity']}/10 el {$data['date']}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'health_event_id' => $schema->string()
                ->description('Identificador (UUID) del evento de salud.')
                ->required(),
            'date' => $schema->string()
                ->description('Fecha del seguimiento en formato YYYY-MM-DD.')
                ->required(),
            'intensity' => $schema->integer()
                ->description('Intensidad del malestar ese día (1-10).')
                ->required(),
            'notes' => $schema->string()
                ->description('Notas adicionales sobre la evolución.'),
        ];
    }
}
