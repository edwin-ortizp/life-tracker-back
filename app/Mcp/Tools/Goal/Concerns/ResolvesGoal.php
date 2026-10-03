<?php

namespace App\Mcp\Tools\Goal\Concerns;

use App\Mcp\Support\McpOutput;
use App\Models\Goal;
use App\Support\GoalProgress;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Response;

trait ResolvesGoal
{
    /** Por id, o por título: exacto primero y luego parcial. */
    protected function resolveGoal(?string $goalId, ?string $title): Goal|Response
    {
        if ($goalId) {
            return Auth::user()->goals()->find($goalId) ?? Response::error('No se encontró la meta o no te pertenece.');
        }

        if (blank($title)) {
            return Response::error('Debes indicar goal_id o title para identificar la meta.');
        }

        $exact = Auth::user()->goals()->whereRaw('lower(title) = ?', [mb_strtolower(trim($title))])->get();
        $matches = $exact->isNotEmpty()
            ? $exact
            : Auth::user()->goals()->where('title', 'like', '%'.addcslashes(trim($title), '%_').'%')->get();

        if ($matches->isEmpty()) {
            return Response::error("No encontré ninguna meta que coincida con \"{$title}\". Usa list-goals-tool para ver tus metas.");
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (Goal $goal) => "{$goal->title} ({$goal->status}, id: {$goal->id})")->implode(', ');

            return Response::error("Hay varias metas que coinciden con \"{$title}\": {$list}. Especifica el goal_id.");
        }

        return $matches->first();
    }

    /** Resumen de una meta con su indicador numérico y si va a tiempo. */
    protected function presentGoal(Goal $goal): array
    {
        $kpi = GoalProgress::configuration($goal->numeric_goal);
        $progress = GoalProgress::calculate($goal->numeric_goal, $goal->start_date, $goal->due_date);

        return McpOutput::compact([
            'id' => $goal->id,
            'title' => $goal->title,
            'status' => $goal->status,
            'start_date' => $goal->start_date?->toDateString(),
            'due_date' => $goal->due_date?->toDateString(),
            'days_left' => $goal->due_date && $goal->status === 'active' ? (int) today()->diffInDays($goal->due_date, false) : null,
            'indicator' => $kpi ? McpOutput::compact([
                'name' => $kpi['name'],
                'unit' => $kpi['unit'],
                'direction' => $kpi['direction'],
                'start' => $kpi['startValue'],
                'target' => $kpi['targetValue'],
                'current' => $kpi['currentValue'],
                'progress_percent' => round($progress['actualPercent'], 1),
                'expected_percent' => $progress['expectedPercent'] !== null ? round($progress['expectedPercent'], 1) : null,
                'on_schedule' => $progress['onSchedule'],
            ]) : null,
            'motivation' => ($goal->positive_count || $goal->negative_count)
                ? ['positive' => (int) $goal->positive_count, 'negative' => (int) $goal->negative_count]
                : null,
        ]);
    }
}
