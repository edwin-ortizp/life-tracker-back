<?php

namespace App\Support;

use App\Models\HabitDefinition;
use Illuminate\Support\Collection;

class HabitInsights
{
    /**
     * @param  Collection<int, HabitDefinition>  $habits
     * @param  Collection<int, string>  $trackedDateKeys
     * @param  array<int, array<string, bool>>  $completionMap
     * @return Collection<int, array{kind: string, title: string, value: string, message: string, tone: string}>
     */
    public function weekly(Collection $habits, Collection $trackedDateKeys, array $completionMap): Collection
    {
        if ($habits->isEmpty()) {
            return collect([$this->insight('start', 'Primer paso', 'Sin hábitos', 'Cuando agregues tu primer hábito, aquí aparecerán patrones útiles.', 'neutral')]);
        }

        if ($trackedDateKeys->isEmpty()) {
            return collect([$this->insight('future', 'Semana por comenzar', 'Sin evaluación', 'Los insights aparecerán cuando esta semana tenga días para registrar.', 'neutral')]);
        }

        $trackedCount = $trackedDateKeys->count();
        $scores = $habits->map(function (HabitDefinition $habit) use ($completionMap, $trackedDateKeys, $trackedCount): array {
            $dates = $completionMap[$habit->id] ?? [];
            $completed = $trackedDateKeys->filter(fn (string $date) => isset($dates[$date]))->count();

            return [
                'habit' => $habit,
                'completed' => $completed,
                'percentage' => (int) round(($completed / $trackedCount) * 100),
            ];
        })->values();
        $totalCompleted = $scores->sum('completed');

        if ($trackedCount < 2 || $totalCompleted === 0) {
            $first = $habits->first();

            return collect([$this->insight(
                'start',
                'Todavía estamos aprendiendo',
                "{$totalCompleted} registros",
                $totalCompleted === 0
                    ? "Empieza con {$first->name}; dos días de registro bastarán para mostrar patrones."
                    : 'Sigue registrando un día más para obtener comparaciones útiles.',
                'support',
            )]);
        }

        $mostConsistent = $scores->reduce(function (?array $best, array $candidate): array {
            return $best === null || $candidate['percentage'] > $best['percentage'] ? $candidate : $best;
        });
        $needsAttention = $scores->reduce(function (?array $lowest, array $candidate): array {
            return $lowest === null || $candidate['percentage'] < $lowest['percentage'] ? $candidate : $lowest;
        });
        $bestPeriod = $this->bestPeriod($habits, $trackedDateKeys, $completionMap);

        $insights = collect([
            $this->insight(
                'consistent',
                'Tu hábito más constante',
                $mostConsistent['habit']->name,
                "Lo completaste el {$mostConsistent['percentage']}% de los días evaluados.",
                'success',
            ),
        ]);

        if ($bestPeriod) {
            $insights->push($this->insight(
                'period',
                'Tu franja más sólida',
                $bestPeriod['label'],
                "Allí alcanzaste un {$bestPeriod['percentage']}% de cumplimiento.",
                'support',
            ));
        }

        $allComplete = $scores->every(fn (array $score) => $score['percentage'] === 100);
        $insights->push($this->insight(
            'focus',
            $allComplete ? 'Semana redonda' : 'Un hábito para retomar',
            $allComplete ? 'Todo al día' : $needsAttention['habit']->name,
            $allComplete
                ? 'Todos tus hábitos llegaron al 100%. Disfruta el logro sin subir la exigencia.'
                : "Lleva {$needsAttention['percentage']}%. Una repetición amable puede volver a ponerlo en movimiento.",
            $allComplete ? 'celebration' : 'warm',
        ));

        return $insights->take(3)->values();
    }

    /**
     * @param  Collection<int, HabitDefinition>  $habits
     * @param  Collection<int, string>  $trackedDateKeys
     * @param  array<int, array<string, bool>>  $completionMap
     * @return array{label: string, percentage: int}|null
     */
    private function bestPeriod(Collection $habits, Collection $trackedDateKeys, array $completionMap): ?array
    {
        $labels = ['morning' => 'Mañana', 'afternoon' => 'Tarde', 'night' => 'Noche', 'anytime' => 'Cualquier momento'];
        $best = null;

        foreach ($labels as $period => $label) {
            $periodHabits = $habits->filter(fn (HabitDefinition $habit) => ($habit->time_of_day ?: 'anytime') === $period);
            if ($periodHabits->isEmpty()) {
                continue;
            }

            $possible = $periodHabits->count() * $trackedDateKeys->count();
            $completed = $periodHabits->sum(function (HabitDefinition $habit) use ($completionMap, $trackedDateKeys): int {
                $dates = $completionMap[$habit->id] ?? [];

                return $trackedDateKeys->filter(fn (string $date) => isset($dates[$date]))->count();
            });
            $candidate = ['label' => $label, 'percentage' => (int) round(($completed / $possible) * 100)];

            if ($best === null || $candidate['percentage'] > $best['percentage']) {
                $best = $candidate;
            }
        }

        return $best;
    }

    /** @return array{kind: string, title: string, value: string, message: string, tone: string} */
    private function insight(string $kind, string $title, string $value, string $message, string $tone): array
    {
        return compact('kind', 'title', 'value', 'message', 'tone');
    }
}
