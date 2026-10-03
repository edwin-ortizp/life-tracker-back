<?php

namespace App\Mcp\Tools\Focus;

use App\Models\PomodoroSession;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra manualmente un bloque de trabajo concentrado ya terminado (inicio y fin, o fin y duración) con una descripción de en qué trabajó, igual que el registro manual del pomodoro. No admite tiempo futuro ni más de 16 horas.')]
class LogFocusSessionTool extends Tool
{
    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'start' => ['nullable', 'date'],
            'end' => ['nullable', 'date'],
            'minutes' => ['nullable', 'integer', 'min:1', 'max:960'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $timezone = config('app.timezone');
        $end = filled($data['end'] ?? null) ? Carbon::parse($data['end'], $timezone) : now($timezone);
        $start = filled($data['start'] ?? null)
            ? Carbon::parse($data['start'], $timezone)
            : (isset($data['minutes']) ? $end->copy()->subMinutes($data['minutes']) : null);

        if (! $start) {
            return Response::error('Indica start, o minutes (con end opcional; por defecto termina ahora).');
        }
        if ($end->lte($start)) {
            return Response::error('El fin debe ser posterior al inicio.');
        }
        if ($end->isFuture()) {
            return Response::error('No puedes registrar tiempo que todavía no ha transcurrido.');
        }

        $duration = (int) $start->diffInSeconds($end);
        if ($duration > 57600) {
            return Response::error('El registro manual no puede superar 16 horas.');
        }

        PomodoroSession::create([
            'date' => $start->toDateString(),
            'start_time' => ['timestamp' => $start->timestamp],
            'end_time' => ['timestamp' => $end->timestamp],
            'duration' => $duration,
            'completed' => true,
            'description' => filled($data['description'] ?? null) ? trim($data['description']) : null,
        ]);

        return Response::text('Bloque de foco registrado: '.intdiv($duration, 60).' min el '.$start->toDateString()
            .' ('.$start->format('H:i').'–'.$end->format('H:i').').');
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'start' => $schema->string()->description('Inicio (YYYY-MM-DD HH:MM).'),
            'end' => $schema->string()->description('Fin (YYYY-MM-DD HH:MM). Por defecto ahora.'),
            'minutes' => $schema->integer()->description('Duración en minutos si no envías start.'),
            'description' => $schema->string()->description('En qué trabajó.'),
        ];
    }
}
