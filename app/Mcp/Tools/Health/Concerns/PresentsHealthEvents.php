<?php

namespace App\Mcp\Tools\Health\Concerns;

use App\Mcp\Support\McpOutput;
use App\Models\HealthEvent;
use App\Models\HealthLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Formato y filtros compartidos por las herramientas MCP de salud, para que el
 * agente reciba el mismo estado explícito en lugar de inferirlo de end_date.
 */
trait PresentsHealthEvents
{
    /**
     * - active: síntoma, enfermedad o procedimiento sin recuperación registrada.
     * - recovered: tiene fecha de recuperación.
     * - upcoming: cita, chequeo o vacuna con fecha futura.
     * - done: cita, chequeo o vacuna ya ocurrida.
     */
    protected function healthStatus(HealthEvent $event): string
    {
        if (in_array($event->type, HealthEvent::EVOLUTION_TYPES, true)) {
            if ($event->end_date) {
                return 'recovered';
            }

            return $event->event_date->isFuture() ? 'upcoming' : 'active';
        }

        return $event->event_date->isFuture() ? 'upcoming' : 'done';
    }

    /** Eventos que siguen abiertos hoy. */
    protected function applyActiveHealthFilter(Builder|HasMany $query): Builder|HasMany
    {
        return $query
            ->whereIn('type', HealthEvent::EVOLUTION_TYPES)
            ->whereNull('end_date')
            ->whereDate('event_date', '<=', today()->toDateString());
    }

    /**
     * Busca palabras sueltas en título y notas (cualquiera de ellas). Las palabras
     * de menos de 4 letras se ignoran para no traer ruido ("de", "el", "dolor" sí entra).
     */
    protected function applyHealthSearch(Builder|HasMany $query, ?string $search): Builder|HasMany
    {
        $words = collect(preg_split('/[\s,;]+/u', mb_strtolower(trim((string) $search))))
            ->filter(fn (string $word) => mb_strlen($word) >= 4)
            ->unique()
            ->values();

        if ($words->isEmpty()) {
            return filled($search)
                ? $query->where(fn ($match) => $match->where('title', 'like', '%'.addcslashes(trim($search), '%_').'%'))
                : $query;
        }

        return $query->where(function ($match) use ($words) {
            foreach ($words as $word) {
                $like = '%'.addcslashes($word, '%_').'%';
                $match->orWhere('title', 'like', $like)->orWhere('notes', 'like', $like);
            }
        });
    }

    /** Filtra por zona del cuerpo guardada en details.body_areas (o el formato antiguo). */
    protected function filterByBodyArea($events, ?string $area)
    {
        return $area ? $events->filter(fn (HealthEvent $event) => in_array($area, $event->bodyAreas(), true))->values() : $events;
    }

    /** @return array<string, mixed> */
    protected function presentHealthEvent(HealthEvent $event, bool $full = true, int $followUps = 0): array
    {
        $status = $this->healthStatus($event);
        $areas = $event->bodyAreas();
        $details = $event->details ?? [];
        $logs = $followUps > 0 && $event->relationLoaded('logs') ? $event->logs : collect();

        return McpOutput::compact([
            'id' => $event->id,
            'type' => $event->type,
            'title' => $event->title,
            'status' => $status,
            'event_date' => $event->event_date->toDateString(),
            'end_date' => $event->end_date?->toDateString(),
            'days_open' => $status === 'active' ? (int) $event->event_date->diffInDays(today()) : null,
            'body_areas' => $areas === [] ? null : HealthEvent::bodyAreasLabel($areas, $details['body_area_note'] ?? null),
            'condition' => isset($details['condition']) ? HealthEvent::illnessLabel($details['condition'], $details['condition_note'] ?? null) : null,
            'provider' => $details['provider'] ?? null,
            'specialty' => $details['specialty'] ?? null,
            'facility' => $details['facility'] ?? null,
            'vaccine' => isset($details['vaccine_name']) ? trim($details['vaccine_name'].' '.($details['dose'] ?? '')) : null,
            'is_sensitive' => $event->is_sensitive ? true : null,
            'notes' => $full ? $event->notes : McpOutput::excerpt($event->notes, 200),
            'follow_ups' => $logs->isEmpty() ? null : $logs->sortByDesc('date')->take($followUps)->map(fn (HealthLog $log) => McpOutput::compact([
                'id' => $log->id,
                'date' => $log->date->toDateString(),
                'intensity' => $log->intensity,
                'notes' => $log->notes,
            ]))->values()->all(),
        ]);
    }
}
