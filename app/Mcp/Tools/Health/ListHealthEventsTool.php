<?php

namespace App\Mcp\Tools\Health;

use App\Mcp\Tools\Health\Concerns\PresentsHealthEvents;
use App\Models\HealthEvent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista eventos de salud (citas, chequeos, procedimientos, síntomas, enfermedades, vacunas) con estado explícito (active, recovered, upcoming, done), zonas del cuerpo y, si se pide, la evolución de intensidad. Filtra por texto, zona, tipo, estado, fechas. Úsala para antecedentes concretos ("¿cuándo fue el último examen de…?"). Si el usuario cuenta un síntoma o malestar, empieza por get-health-context-tool. Los eventos marcados como sensibles se omiten salvo include_sensitive=true; hidden_sensitive dice cuántos se ocultaron.')]
class ListHealthEventsTool extends Tool
{
    use PresentsHealthEvents;

    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'type' => ['nullable', 'string', Rule::in(array_keys(HealthEvent::TYPES))],
            'period' => ['nullable', 'string', Rule::in(['upcoming', 'history', 'all'])],
            'active_only' => ['nullable', 'boolean'],
            'search' => ['nullable', 'string', 'max:200'],
            'body_area' => ['nullable', 'string', Rule::in(array_keys(HealthEvent::BODY_AREAS))],
            'since' => ['nullable', 'date'],
            'until' => ['nullable', 'date'],
            'include_sensitive' => ['nullable', 'boolean'],
            'include_follow_ups' => ['nullable', 'boolean'],
            'brief' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
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

        if (! empty($data['active_only'])) {
            $this->applyActiveHealthFilter($query);
        }

        if (filled($data['since'] ?? null)) {
            // Un malestar que empezó antes pero sigue abierto también cuenta en la ventana.
            $query->where(fn ($window) => $window
                ->whereDate('event_date', '>=', $data['since'])
                ->orWhereDate('end_date', '>=', $data['since'])
                ->orWhere(fn ($open) => $open->whereIn('type', HealthEvent::EVOLUTION_TYPES)->whereNull('end_date')));
        }

        if (filled($data['until'] ?? null)) {
            $query->whereDate('event_date', '<=', $data['until']);
        }

        $this->applyHealthSearch($query, $data['search'] ?? null);

        $includeSensitive = (bool) ($data['include_sensitive'] ?? false);
        $hidden = $includeSensitive ? 0 : (clone $query)->where('is_sensitive', true)->count();

        if (! $includeSensitive) {
            $query->where('is_sensitive', false);
        }

        $followUps = ! empty($data['include_follow_ups']) ? 5 : 0;

        $events = $query
            ->when($followUps > 0, fn ($query) => $query->with('logs'))
            ->orderByDesc('event_date')
            // Si se filtra por zona en memoria, se trae más para no quedarse corto.
            ->limit(! empty($data['body_area']) ? 200 : ($data['limit'] ?? 30))
            ->get();

        $events = $this->filterByBodyArea($events, $data['body_area'] ?? null)->take($data['limit'] ?? 30);
        $full = empty($data['brief']);

        return Response::structured(array_filter([
            'events' => $events->map(fn (HealthEvent $event) => $this->presentHealthEvent($event, $full, $followUps))->values()->all(),
            'hidden_sensitive' => $hidden ?: null,
        ], fn ($value) => $value !== null));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'type' => $schema->string()
                ->enum(array_keys(HealthEvent::TYPES))
                ->description('Filtra por tipo de evento.'),
            'period' => $schema->string()
                ->enum(['upcoming', 'history', 'all'])
                ->description('upcoming = fecha futura, history = ya ocurrido. Por defecto todos.'),
            'active_only' => $schema->boolean()
                ->description('Solo síntomas, enfermedades o procedimientos sin recuperación registrada.'),
            'search' => $schema->string()
                ->description('Palabras a buscar en título y notas; basta con que aparezca una (p. ej. "riñón renal orina").'),
            'body_area' => $schema->string()
                ->enum(array_keys(HealthEvent::BODY_AREAS))
                ->description('Zona del cuerpo (solo eventos que la tengan registrada).'),
            'since' => $schema->string()
                ->description('Desde esta fecha (YYYY-MM-DD). Incluye malestares que empezaron antes y siguen abiertos.'),
            'until' => $schema->string()
                ->description('Hasta esta fecha (YYYY-MM-DD).'),
            'include_sensitive' => $schema->boolean()
                ->description('Incluye eventos marcados como sensibles. Úsalo solo si el tema actual los requiere.'),
            'include_follow_ups' => $schema->boolean()
                ->description('Incluye los últimos 5 registros de intensidad de cada evento.'),
            'brief' => $schema->boolean()
                ->description('Recorta las notas a un extracto corto.'),
            'limit' => $schema->integer()
                ->description('Máximo de eventos (por defecto 30, máximo 100).'),
        ];
    }
}
