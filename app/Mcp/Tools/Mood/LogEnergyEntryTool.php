<?php

namespace App\Mcp\Tools\Mood;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra el nivel de energía del usuario autenticado (escala 1-5).')]
class LogEnergyEntryTool extends Tool
{
    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'level' => ['required', 'integer', 'between:1,5'],
            'date' => ['nullable', 'date'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $now = now();

        $entry = Auth::user()->energyEntries()->create([
            'date' => $data['date'] ?? $now->toDateString(),
            'level' => $data['level'],
            'time' => $now->format('H:i'),
            'timestamp' => $now->timestamp,
            'comment' => $data['comment'] ?? null,
        ]);

        return Response::text("Energía registrada: nivel {$entry->level}/5 el {$entry->date->toDateString()}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'level' => $schema->integer()
                ->description('Nivel de energía (1-5).')
                ->required(),
            'date' => $schema->string()
                ->description('Fecha en formato YYYY-MM-DD. Por defecto hoy.'),
            'comment' => $schema->string()
                ->description('Comentario adicional.'),
        ];
    }
}
