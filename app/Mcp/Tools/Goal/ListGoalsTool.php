<?php

namespace App\Mcp\Tools\Goal;

use App\Mcp\Support\McpOutput;
use App\Mcp\Tools\Goal\Concerns\ResolvesGoal;
use App\Models\Goal;
use App\Models\GoalEntry;
use App\Models\GoalNumericEntry;
use App\Models\Task;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista las metas u objetivos del usuario (activas por defecto) con su indicador numérico, porcentaje de avance contra lo esperado a la fecha y último avance registrado. Con goal_id o title devuelve el detalle de una meta: descripción, bitácora de avances e hitos, historial del indicador y tareas vinculadas. Úsala cuando hable de propósitos, objetivos, metas del año, progreso o motivación.')]
class ListGoalsTool extends Tool
{
    use ResolvesGoal;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', Rule::in(['active', 'completed', 'abandoned', 'all'])],
            'goal_id' => ['nullable', 'string'],
            'title' => ['nullable', 'string'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        if (filled($data['goal_id'] ?? null) || filled($data['title'] ?? null)) {
            $goal = $this->resolveGoal($data['goal_id'] ?? null, $data['title'] ?? null);

            return $goal instanceof Response ? $goal : Response::structured($this->detail($goal, $data['limit'] ?? 20));
        }

        $status = $data['status'] ?? 'active';

        $goals = Auth::user()->goals()
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->with([
                'goalEntries' => fn ($query) => $query->orderByDesc('date')->orderByDesc('created_at'),
            ])
            ->withCount(['tasks as pending_tasks_count' => fn ($query) => $query->where('completed', false)])
            ->orderByRaw('due_date is null')
            ->orderBy('due_date')
            ->limit($data['limit'] ?? 30)
            ->get();

        return Response::structured([
            'goals' => $goals->map(fn (Goal $goal) => McpOutput::compact([
                ...$this->presentGoal($goal),
                'description' => McpOutput::excerpt($goal->description, 200),
                'last_update' => ($entry = $goal->goalEntries->first()) ? [
                    'date' => $entry->date->toDateString(),
                    'text' => McpOutput::excerpt($entry->text, 160),
                ] : null,
                'milestones' => $goal->goalEntries->where('is_milestone', true)->count() ?: null,
                'pending_tasks' => (int) $goal->pending_tasks_count ?: null,
            ]))->all(),
        ]);
    }

    private function detail(Goal $goal, int $limit): array
    {
        $goal->load([
            'goalEntries' => fn ($query) => $query->orderByDesc('date')->orderByDesc('created_at'),
            'goalNumericEntries' => fn ($query) => $query->orderByDesc('date')->orderByDesc('created_at'),
            'tasks',
        ]);

        return McpOutput::compact([
            ...$this->presentGoal($goal),
            'description' => $goal->description,
            'entries' => $goal->goalEntries->take($limit)->map(fn (GoalEntry $entry) => McpOutput::compact([
                'id' => $entry->id,
                'date' => $entry->date->toDateString(),
                'text' => $entry->text,
                'milestone' => $entry->is_milestone ? true : null,
            ]))->values()->all(),
            'indicator_history' => $goal->goalNumericEntries->isEmpty() ? null : $goal->goalNumericEntries->take($limit)->map(fn (GoalNumericEntry $entry) => McpOutput::compact([
                'id' => $entry->id,
                'date' => $entry->date->toDateString(),
                'value' => (float) $entry->value,
                'note' => $entry->note,
            ]))->values()->all(),
            'tasks' => $goal->tasks->isEmpty() ? null : $goal->tasks->sortBy('completed')->map(fn (Task $task) => McpOutput::compact([
                'id' => $task->id,
                'title' => $task->title,
                'completed' => $task->completed,
                'due' => $task->end_date?->toDateString(),
            ]))->values()->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->enum(['active', 'completed', 'abandoned', 'all'])->description('Filtra por estado. Por defecto active.'),
            'goal_id' => $schema->string()->description('Id de una meta para ver su detalle.'),
            'title' => $schema->string()->description('Título (o parte) de una meta para ver su detalle.'),
            'limit' => $schema->integer()->description('Máximo de metas, o de avances en el detalle.'),
        ];
    }
}
