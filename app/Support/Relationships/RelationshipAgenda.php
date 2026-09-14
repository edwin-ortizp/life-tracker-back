<?php

namespace App\Support\Relationships;

use App\Models\Plan;
use App\Models\Relationship;
use App\Models\RelationshipEvent;
use App\Models\Task;
use App\Support\EventDate;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Lo que queda por gestionar con una persona: tareas pendientes, acontecimientos próximos,
 * planes con fecha y su próximo cumpleaños, en una sola lista ordenada por fecha.
 */
final class RelationshipAgenda
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public static function upcoming(Relationship $relationship, ?int $limit = 5, ?Carbon $reference = null): Collection
    {
        $today = ($reference ?? Carbon::today())->copy()->startOfDay();
        $items = collect();

        $relationship->tasks()->where('tasks.completed', false)->get()
            ->each(function (Task $task) use ($items, $today): void {
                $due = $task->end_date?->copy()->startOfDay();
                $overdue = $due !== null && $due->lt($today);

                $items->push(self::item(
                    kind: 'task', id: $task->id, title: $task->title, date: $due,
                    dateLabel: $due ? EventDate::day($due)->label() : 'Sin fecha',
                    type: 'Tarea', typeTone: 'info', icon: 'bi-check2-square',
                    state: $overdue ? 'Vencida' : 'Por hacer', stateTone: $overdue ? 'danger' : 'neutral',
                    url: route('tasks.list', ['edit' => $task->id]),
                    extra: ['recurrent' => (bool) $task->is_recurrent],
                ));
            });

        $relationship->relationshipEvents()->active()->upcoming($today)->get()
            ->each(function (RelationshipEvent $event) use ($items, $today): void {
                $ongoing = $event->starts_on !== null && $event->starts_on->lt($today);

                $items->push(self::item(
                    kind: 'event', id: $event->id, title: $event->title, date: $ongoing ? $today : $event->starts_on,
                    dateLabel: $event->dateLabel(), type: 'Acontecimiento', typeTone: 'primary', icon: 'bi-calendar-event',
                    state: $ongoing ? 'En curso' : 'Próximo', stateTone: $ongoing ? 'success' : 'info',
                    extra: ['category' => $event->categoryLabel(), 'archived' => $event->is_archived],
                ));
            });

        Plan::query()->forRelationship($relationship)
            ->whereIn('status', ['pending', 'scheduled'])
            ->whereDate('scheduled_on', '>=', $today->toDateString())
            ->get()
            ->each(function (Plan $plan) use ($items): void {
                $items->push(self::item(
                    kind: 'plan', id: $plan->id, title: $plan->title, date: $plan->scheduled_on,
                    dateLabel: EventDate::day($plan->scheduled_on)->label(), type: 'Plan', typeTone: 'success', icon: $plan->icon(),
                    state: $plan->statusLabel(), stateTone: 'primary', url: route('plans.show', $plan),
                ));
            });

        if ($birthday = $relationship->birthday()) {
            $next = $birthday->nextOccurrence($today);
            $days = $birthday->daysUntil($today);

            $items->push(self::item(
                kind: 'birthday', id: $relationship->id, title: 'Cumpleaños de '.$relationship->displayName(), date: $next,
                dateLabel: EventDate::day($next)->label(), type: 'Cumpleaños', typeTone: 'warning', icon: 'bi-cake2',
                state: $days === 0 ? 'Hoy' : 'En '.$days.' '.($days === 1 ? 'día' : 'días'), stateTone: 'warning',
                url: route('relationships.birthdays'),
            ));
        }

        $sorted = $items->sortBy('sort')->values();

        return $limit === null ? $sorted : $sorted->take($limit)->values();
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private static function item(
        string $kind,
        string $id,
        string $title,
        ?Carbon $date,
        string $dateLabel,
        string $type,
        string $typeTone,
        string $icon,
        string $state,
        string $stateTone,
        ?string $url = null,
        array $extra = [],
    ): array {
        return [
            'kind' => $kind,
            'id' => $id,
            'title' => $title,
            'date' => $date,
            'dateLabel' => $dateLabel,
            'type' => $type,
            'typeTone' => $typeTone,
            'icon' => $icon,
            'state' => $state,
            'stateTone' => $stateTone,
            'url' => $url,
            'recurrent' => false,
            'category' => null,
            'archived' => false,
            ...$extra,
            // Con fecha primero y en orden cronológico; lo que no tiene fecha va al final.
            'sort' => ($date ? '0'.$date->format('Ymd') : '1').mb_strtolower($title),
        ];
    }
}
