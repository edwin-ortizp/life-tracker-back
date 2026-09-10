<?php

namespace App\Mcp\Tools\Health;

use App\Models\HealthEvent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los eventos de salud del usuario autenticado, con filtros opcionales de tipo y periodo.')]
class ListHealthEventsTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'type' => ['nullable', 'string', Rule::in(array_keys(HealthEvent::TYPES))],
            'period' => ['nullable', 'string', Rule::in(['upcoming', 'history', 'all'])],
        ]);

        $query = Auth::user()->healthEvents();

        if (! empty($data['type'])) {
            $query->where('type', $data['type']);
        }

        $period = $data['period'] ?? 'all';

        if ($period === 'upcoming') {
            $query->whereDate('event_date', '>', today());
        } elseif ($period === 'history') {
            $query->whereDate('event_date', '<=', today());
        }

        $events = $query->orderByDesc('event_date')->limit(30)->get();

        return Response::structured([
            'events' => $events->map(fn ($event) => [
                'id' => $event->id,
                'type' => $event->type,
                'title' => $event->title,
                'event_date' => $event->event_date->toDateString(),
                'end_date' => $event->end_date?->toDateString(),
                'notes' => $event->notes,
            ])->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'type' => $schema->string()
                ->enum(array_keys(HealthEvent::TYPES))
                ->description('Filtra por tipo de evento.'),
            'period' => $schema->string()
                ->enum(['upcoming', 'history', 'all'])
                ->description('Filtra por periodo. Por defecto todos.'),
        ];
    }
}
