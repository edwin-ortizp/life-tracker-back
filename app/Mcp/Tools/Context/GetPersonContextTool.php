<?php

namespace App\Mcp\Tools\Context;

use App\Mcp\Support\McpOutput;
use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use App\Models\Plan;
use App\Models\PlanVisit;
use App\Models\Relationship;
use App\Models\RelationshipEvent;
use App\Models\Task;
use App\Support\RelationshipEmotionalPatterns;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Reúne en una llamada el contexto de una persona: ficha, cumpleaños, visitas y planes hechos juntos, lugares más repetidos, planes pendientes compartidos, eventos recientes de su vida, ánimo asociado y tareas que la mencionan o están vinculadas. Úsala primero cuando la conversación gira en torno a alguien (pareja, familiar, amigo), antes de aconsejar, planear algo con esa persona o responder sobre la relación. depth=brief (por defecto) trae lo reciente; full amplía historial y notas.')]
class GetPersonContextTool extends Tool
{
    use ResolvesContact;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            'contact_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'depth' => ['nullable', 'string', Rule::in(['brief', 'full'])],
            'include_sensitive' => ['nullable', 'boolean'],
        ]);

        $contact = $this->resolveContact($data['contact_id'] ?? null, $data['name'] ?? null);
        if ($contact instanceof Response) {
            return $contact;
        }

        $full = ($data['depth'] ?? 'brief') === 'full';
        $includeSensitive = (bool) ($data['include_sensitive'] ?? false);
        $contact->load(['circle', 'aliases', 'tags']);

        return Response::structured(McpOutput::compact([
            'person' => $this->profile($contact, $full),
            'visits' => $this->visits($contact, $full),
            'pending_plans' => $this->pendingPlans($contact, $full ? 15 : 5),
            'life_events' => $this->lifeEvents($contact, $full ? 15 : 3, $includeSensitive),
            'mood_with_person' => $this->mood($contact),
            'tasks' => $this->tasks($contact, $full ? 15 : 5),
        ]));
    }

    private function profile(Relationship $contact, bool $full): array
    {
        $birthday = $contact->birthday();

        return [
            'id' => $contact->id,
            'name' => $contact->full_name,
            'nickname' => $contact->nickname,
            'aliases' => $contact->aliases->pluck('alias')->all() ?: null,
            'category' => $contact->category,
            'circle' => $contact->circle?->name,
            'tags' => $contact->tags->pluck('name')->all() ?: null,
            'city' => $contact->city,
            'occupation' => $contact->occupation,
            'organization' => $contact->organization,
            'birthday' => $birthday?->label(),
            'birthday_in_days' => $birthday?->daysUntil(),
            'age' => $birthday?->currentAge(),
            'last_contact_at' => $contact->last_contact_at?->toDateString(),
            'contact_frequency_days' => $contact->contact_frequency_days,
            'notes' => $full ? $contact->general_notes : McpOutput::excerpt($contact->general_notes),
        ];
    }

    private function visits(Relationship $contact, bool $full): ?array
    {
        $visits = PlanVisit::query()
            ->with(['plan', 'relationships'])
            ->whereHas('plan')
            ->whereHas('relationships', fn ($people) => $people->whereKey($contact->id))
            ->orderByDesc('visited_on')
            ->get();

        if ($visits->isEmpty()) {
            return null;
        }

        return [
            'total' => $visits->count(),
            'first_on' => $visits->last()->visited_on->toDateString(),
            'last_on' => $visits->first()->visited_on->toDateString(),
            'last_30_days' => $visits->filter(fn (PlanVisit $visit) => $visit->visited_on->gte(today()->subDays(30)))->count(),
            'most_repeated' => $visits->groupBy('plan_id')
                ->filter(fn (Collection $group) => $group->count() > 1)
                ->map(fn (Collection $group) => ['plan' => $group->first()->plan->title, 'times' => $group->count(), 'last_on' => $group->first()->visited_on->toDateString()])
                ->sortByDesc('times')->take(3)->values()->all() ?: null,
            'recent' => $visits->take($full ? 30 : 5)->map(fn (PlanVisit $visit) => McpOutput::compact([
                'date' => $visit->visited_on->toDateString(),
                'plan' => $visit->plan->title,
                'city' => $visit->plan->city,
                'with_others' => $visit->relationships->reject(fn (Relationship $person) => $person->is($contact))->map->displayName()->values()->all() ?: null,
                'comment' => $visit->comment,
            ]))->values()->all(),
        ];
    }

    private function pendingPlans(Relationship $contact, int $limit): ?array
    {
        $plans = Auth::user()->plans()
            ->forRelationship($contact)
            ->whereIn('status', ['pending', 'scheduled'])
            ->withVisitStats($contact->id)
            ->get();

        if ($plans->isEmpty()) {
            return null;
        }

        // Primero lo programado, luego lo que nunca han hecho juntos.
        $sorted = $plans->sortBy(fn (Plan $plan) => [
            $plan->status === 'scheduled' ? 0 : 1,
            $plan->scheduled_on?->toDateString() ?? '9999',
            (int) $plan->visits_count,
            $plan->title,
        ])->values();

        return [
            'total' => $plans->count(),
            'never_done_together' => $plans->where('visits_count', 0)->count(),
            'items' => $sorted->take($limit)->map(fn (Plan $plan) => McpOutput::compact([
                'id' => $plan->id,
                'title' => $plan->title,
                'type' => $plan->typeLabel(),
                'city' => $plan->city,
                'scheduled_on' => $plan->scheduled_on?->toDateString(),
                'is_overdue' => $plan->status === 'scheduled' && $plan->scheduled_on?->lt(today()) ? true : null,
                'times_together' => (int) $plan->visits_count ?: null,
            ]))->all(),
        ];
    }

    private function lifeEvents(Relationship $contact, int $limit, bool $includeSensitive): ?array
    {
        $query = $contact->relationshipEvents()->active();
        $hidden = $includeSensitive ? 0 : (clone $query)->where('is_sensitive', true)->count();
        $events = $query->visibleGlobally($includeSensitive)->chronological('desc')->limit($limit)->get();

        if ($events->isEmpty() && $hidden === 0) {
            return null;
        }

        return McpOutput::compact([
            'items' => $events->map(fn (RelationshipEvent $event) => McpOutput::compact([
                'title' => $event->title,
                'category' => $event->category,
                'date' => $event->dateLabel(),
                'upcoming' => $event->isUpcoming() ? true : null,
                'notes' => McpOutput::excerpt($event->notes, 200),
            ]))->all(),
            'hidden_sensitive' => $hidden ?: null,
        ]);
    }

    private function mood(Relationship $contact): ?array
    {
        $summary = RelationshipEmotionalPatterns::summarize($contact, 30);

        if ($summary['sample_size'] === 0) {
            return null;
        }

        return [
            'period_days' => $summary['days'],
            'entries' => $summary['sample_size'],
            'emotions' => collect($summary['emotions'])->take(5)->map(fn (array $emotion) => trim($emotion['emoji'].' '.$emotion['text']).' ×'.$emotion['count'])->all(),
            'average_intensity' => $summary['intensity']['average'],
        ];
    }

    private function tasks(Relationship $contact, int $limit): ?array
    {
        $linked = $contact->tasks()->where('completed', false)->get();

        // También las que la mencionan por nombre o apodo como palabra completa.
        $names = collect([$contact->nickname, $contact->full_name, ...$contact->aliases->pluck('alias')])
            ->filter(fn ($name) => filled($name) && mb_strlen($name) >= 3)
            ->unique();
        $pattern = $names->isEmpty() ? null : '/(?<![\p{L}\p{N}])('.$names->map(fn ($name) => preg_quote($name, '/'))->implode('|').')(?![\p{L}\p{N}])/iu';

        $mentioned = $pattern === null ? collect() : Auth::user()->tasks()
            ->where('completed', false)
            ->where(function ($query) use ($names) {
                foreach ($names as $name) {
                    $query->orWhere('title', 'like', '%'.addcslashes($name, '%_').'%');
                }
            })
            ->limit(50)
            ->get()
            ->filter(fn (Task $task) => preg_match($pattern, $task->title) === 1);

        $tasks = $linked->concat($mentioned)->unique('id');

        if ($tasks->isEmpty()) {
            return null;
        }

        return $tasks->sortBy(fn (Task $task) => $task->end_date?->timestamp ?? PHP_INT_MAX)
            ->take($limit)
            ->map(fn (Task $task) => McpOutput::compact([
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'due' => $task->end_date?->toDateString(),
                'linked' => $linked->contains('id', $task->id) ? true : null,
            ]))->values()->all();
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'contact_id' => $schema->string()->description('Id de la persona. Alternativa a "name".'),
            'name' => $schema->string()->description('Nombre, apodo o alias (gana la coincidencia exacta de alias o apodo).'),
            'depth' => $schema->string()->enum(['brief', 'full'])->description('brief (por defecto): lo reciente y resumido. full: historial de visitas completo, más eventos y notas completas.'),
            'include_sensitive' => $schema->boolean()->description('Incluye eventos de vida marcados como sensibles.'),
        ];
    }
}
