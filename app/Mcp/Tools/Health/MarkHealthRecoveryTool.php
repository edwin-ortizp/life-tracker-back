<?php

namespace App\Mcp\Tools\Health;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Marca como recuperado un evento de salud de tipo síntoma o enfermedad (por ejemplo, "ya se me quitó la gripe").')]
class MarkHealthRecoveryTool extends Tool
{
    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'health_event_id' => ['required', 'string'],
            'date' => ['nullable', 'date'],
            'intensity' => ['nullable', 'integer', 'between:1,10'],
        ]);

        $event = Auth::user()->healthEvents()->find($data['health_event_id']);
        if (! $event) {
            return Response::error('No se encontró el evento de salud o no te pertenece.');
        }

        if (! in_array($event->type, ['symptom', 'illness'], true)) {
            return Response::error('Solo los eventos de tipo "symptom" o "illness" admiten marcarse como recuperados.');
        }

        if ($event->end_date) {
            return Response::error("\"{$event->title}\" ya estaba marcado como recuperado.");
        }

        $date = $data['date'] ?? today()->toDateString();

        if ($date < $event->event_date->toDateString()) {
            return Response::error('La recuperación no puede ser anterior al inicio del malestar.');
        }

        $log = $event->logs()->whereDate('date', $date)->first();
        if (! $log && ! isset($data['intensity'])) {
            return Response::error('Indica la intensidad del día de recuperación (o registra antes un seguimiento para esa fecha).');
        }

        if (! $log) {
            $event->logs()->create(['date' => $date, 'intensity' => $data['intensity']]);
        }

        $event->update(['end_date' => $date]);

        return Response::text("\"{$event->title}\" marcado como recuperado el {$date}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'health_event_id' => $schema->string()
                ->description('Identificador (UUID) del evento de salud.')
                ->required(),
            'date' => $schema->string()
                ->description('Fecha de recuperación en formato YYYY-MM-DD. Por defecto hoy.'),
            'intensity' => $schema->integer()
                ->description('Intensidad en el día de recuperación (1-10). Requerida si no hay ya un seguimiento registrado para esa fecha.'),
        ];
    }
}
