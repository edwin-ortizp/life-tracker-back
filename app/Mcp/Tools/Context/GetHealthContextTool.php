<?php

namespace App\Mcp\Tools\Context;

use App\Mcp\Support\McpOutput;
use App\Mcp\Tools\Health\Concerns\PresentsHealthEvents;
use App\Models\HealthEvent;
use App\Models\Task;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Reúne en una llamada el contexto de salud relevante: malestares activos con su evolución, citas y exámenes próximos, tareas de salud pendientes o vinculadas, eventos recientes, antecedentes relacionados con lo que se busca y ánimo y energía de los últimos días. Úsala primero cuando el usuario cuente un síntoma, dolor o malestar, hable de una cita, examen o tratamiento, o pregunte por su salud. Pasa en "search" las palabras clave del síntoma o sistema (p. ej. "riñón renal orina fiebre") y en "body_area" la zona si aplica. Omite eventos sensibles salvo include_sensitive=true.')]
class GetHealthContextTool extends Tool
{
    use PresentsHealthEvents;

    private const RECENT_DAYS = 30;

    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:200'],
            'body_area' => ['nullable', 'string', Rule::in(array_keys(HealthEvent::BODY_AREAS))],
            'depth' => ['nullable', 'string', Rule::in(['brief', 'full'])],
            'include_sensitive' => ['nullable', 'boolean'],
        ]);

        $full = ($data['depth'] ?? 'brief') === 'full';
        $includeSensitive = (bool) ($data['include_sensitive'] ?? false);
        $visible = fn ($query) => $includeSensitive ? $query : $query->where('is_sensitive', false);

        $active = $this->applyActiveHealthFilter($visible(Auth::user()->healthEvents()))
            ->with(['logs', 'tasks'])
            ->orderByDesc('event_date')
            ->get();

        $upcoming = $visible(Auth::user()->healthEvents())
            ->whereDate('event_date', '>', today()->toDateString())
            ->orderBy('event_date')
            ->limit(10)
            ->get();

        $shown = $active->pluck('id')->concat($upcoming->pluck('id'));

        $recent = $visible(Auth::user()->healthEvents())
            ->whereDate('event_date', '>=', today()->subDays(self::RECENT_DAYS)->toDateString())
            ->whereDate('event_date', '<=', today()->toDateString())
            ->whereNotIn('id', $shown)
            ->orderByDesc('event_date')
            ->limit($full ? 20 : 8)
            ->get();

        $shown = $shown->concat($recent->pluck('id'));
        $related = $this->related($data, $visible, $shown, $full ? 20 : 6);

        $hidden = $includeSensitive ? 0 : Auth::user()->healthEvents()->where('is_sensitive', true)->count();

        return Response::structured(McpOutput::compact([
            'today' => today()->toDateString(),
            'active' => $active->map(fn (HealthEvent $event) => [
                ...$this->presentHealthEvent($event, $full, $full ? 10 : 3),
                'tasks' => $this->presentTasks($event->tasks),
            ])->all(),
            'upcoming' => $upcoming->map(fn (HealthEvent $event) => $this->presentHealthEvent($event, $full))->all(),
            'pending_tasks' => $this->pendingHealthTasks($active),
            'recent' => $recent->map(fn (HealthEvent $event) => $this->presentHealthEvent($event, $full))->all(),
            'related_history' => $related?->map(fn (HealthEvent $event) => $this->presentHealthEvent($event, $full))->all(),
            'wellbeing_last_7_days' => $this->wellbeing(),
            'hidden_sensitive' => $hidden ?: null,
        ]));
    }

    /** Antecedentes que coinciden con lo que se busca, fuera de lo ya mostrado. */
    private function related(array $data, callable $visible, Collection $exclude, int $limit): ?Collection
    {
        if (blank($data['search'] ?? null) && blank($data['body_area'] ?? null)) {
            return null;
        }

        $query = $visible(Auth::user()->healthEvents())->whereNotIn('id', $exclude);

        if (filled($data['search'] ?? null)) {
            $this->applyHealthSearch($query, $data['search']);
        }

        $events = $query->orderByDesc('event_date')->limit(200)->get();

        return $this->filterByBodyArea($events, $data['body_area'] ?? null)->take($limit)->values();
    }

    /**
     * Tareas pendientes de salud: las vinculadas a eventos activos y las de una
     * categoría de salud (se detecta por la key o el nombre de la categoría).
     */
    private function pendingHealthTasks(Collection $active): ?array
    {
        $categories = Auth::user()->taskCategories()->get()
            ->filter(fn ($category) => preg_match('/salud|health|m[eé]dic/iu', $category->key.' '.$category->name) === 1)
            ->pluck('key');

        $tasks = Auth::user()->tasks()
            ->where('completed', false)
            ->where(fn ($query) => $query
                ->whereIn('category', $categories)
                ->orWhereHas('healthEvents'))
            ->limit(30)
            ->get()
            ->reject(fn (Task $task) => $active->contains(fn (HealthEvent $event) => $event->tasks->contains('id', $task->id)));

        return $this->presentTasks($tasks);
    }

    private function presentTasks(Collection $tasks): ?array
    {
        $tasks = $tasks->where('completed', false);

        if ($tasks->isEmpty()) {
            return null;
        }

        return $tasks->sortBy(fn (Task $task) => $task->end_date?->timestamp ?? $task->start_date?->timestamp ?? PHP_INT_MAX)
            ->map(fn (Task $task) => McpOutput::compact([
                'id' => $task->id,
                'title' => $task->title,
                'date' => ($task->end_date ?? $task->start_date)?->toDateString(),
            ]))->values()->all();
    }

    private function wellbeing(): ?array
    {
        $from = today()->subDays(6)->toDateString();
        $energy = Auth::user()->energyEntries()->whereDate('date', '>=', $from)->get();
        $mood = Auth::user()->moodEntries()->whereDate('date', '>=', $from)->get();
        $values = $mood->pluck('value')->filter(fn ($value) => is_numeric($value));

        if ($energy->isEmpty() && $mood->isEmpty()) {
            return null;
        }

        return McpOutput::compact([
            'average_energy' => $energy->isEmpty() ? null : round($energy->avg('level'), 2),
            'average_mood_value' => $values->isEmpty() ? null : round($values->avg(), 2),
            'moods' => $mood->groupBy('text')->map(fn ($group, $text) => trim($group->first()->emoji.' '.$text).' ×'.$group->count())->values()->take(5)->all() ?: null,
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'search' => $schema->string()->description('Palabras clave del síntoma, órgano o sistema; trae antecedentes que mencionen cualquiera de ellas en título o notas.'),
            'body_area' => $schema->string()->enum(array_keys(HealthEvent::BODY_AREAS))->description('Zona del cuerpo para buscar antecedentes en esa zona.'),
            'depth' => $schema->string()->enum(['brief', 'full'])->description('brief (por defecto): notas recortadas y lo esencial. full: notas completas, más evolución y más antecedentes.'),
            'include_sensitive' => $schema->boolean()->description('Incluye eventos sensibles. Úsalo solo si el tema actual los requiere.'),
        ];
    }
}
