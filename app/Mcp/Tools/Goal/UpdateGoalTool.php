<?php

namespace App\Mcp\Tools\Goal;

use App\Mcp\Tools\Goal\Concerns\ResolvesGoal;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Actualiza una meta: estado (active, completed, abandoned), título, descripción o fechas. Solo cambia los campos enviados. Para registrar avances usa log-goal-progress-tool.')]
class UpdateGoalTool extends Tool
{
    use ResolvesGoal;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'goal_id' => ['nullable', 'string'],
            'title' => ['nullable', 'string'],
            'new_title' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::in(['active', 'completed', 'abandoned'])],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
        ]);

        $goal = $this->resolveGoal($data['goal_id'] ?? null, $data['title'] ?? null);
        if ($goal instanceof Response) {
            return $goal;
        }

        $changes = array_filter([
            'title' => filled($data['new_title'] ?? null) ? trim($data['new_title']) : null,
            'status' => $data['status'] ?? null,
            'description' => isset($data['description']) ? (trim($data['description']) ?: null) : null,
            'start_date' => $data['start_date'] ?? null,
            'due_date' => $data['due_date'] ?? null,
        ], fn ($value) => $value !== null);

        if (array_key_exists('description', $data) && $data['description'] === '') {
            $changes['description'] = null;
        }

        if ($changes === []) {
            return Response::error('No enviaste ningún cambio.');
        }

        $start = $changes['start_date'] ?? $goal->start_date?->toDateString();
        $due = $changes['due_date'] ?? $goal->due_date?->toDateString();
        if ($start && $due && $due < $start) {
            return Response::error('La fecha límite no puede ser anterior a la de inicio.');
        }

        $goal->update($changes);

        return Response::text("Meta actualizada: \"{$goal->title}\" (".implode(', ', array_keys($changes))."), id: {$goal->id}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'goal_id' => $schema->string()->description('Id de la meta. Alternativa a "title".'),
            'title' => $schema->string()->description('Título actual (o parte) para identificar la meta.'),
            'new_title' => $schema->string()->description('Nuevo título.'),
            'status' => $schema->string()->enum(['active', 'completed', 'abandoned'])->description('Nuevo estado.'),
            'description' => $schema->string()->description('Nueva descripción. "" la borra.'),
            'start_date' => $schema->string()->description('Nueva fecha de inicio (YYYY-MM-DD).'),
            'due_date' => $schema->string()->description('Nueva fecha límite (YYYY-MM-DD).'),
        ];
    }
}
