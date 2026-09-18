<?php

namespace App\Mcp\Tools\Task;

use App\Services\TaskRecurrenceService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Devuelve el detalle completo de una tarea: descripción en markdown, progreso de subtareas, categoría, fechas, estimación y recurrencia con la próxima fecha sugerida. Úsala para leer el contenido antes de recomendar, editar o completar una tarea recurrente.')]
class GetTaskTool extends Tool
{
    public function handle(Request $request, TaskRecurrenceService $recurrence): Response|ResponseFactory
    {
        $data = $request->validate([
            'task_id' => ['required', 'string'],
        ]);

        $task = Auth::user()->tasks()->find($data['task_id']);

        if (! $task) {
            return Response::error('No se encontró la tarea o no te pertenece.');
        }

        $category = $task->category ? Auth::user()->taskCategories()->where('key', $task->category)->first() : null;

        return Response::structured([
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'subtasks' => $task->subtask_progress,
            'category' => $task->category,
            'category_name' => $category?->name,
            'priority' => $task->priority,
            'size' => $task->size,
            'estimated_minutes' => $task->estimated_time,
            'completed' => $task->completed,
            'completed_at' => $task->completed_at?->toIso8601String(),
            'start_date' => $task->start_date?->format($task->start_is_date ? 'Y-m-d' : 'Y-m-d H:i'),
            'end_date' => $task->end_date?->format($task->end_is_date ? 'Y-m-d' : 'Y-m-d H:i'),
            'is_private' => $task->is_private,
            'is_recurrent' => $task->is_recurrent,
            'recurrence' => $task->is_recurrent ? [
                'summary' => $recurrence->describe($task->recurrence),
                'rule' => $task->recurrence,
                'suggested_next_date' => $task->completed ? null : $recurrence->suggestedNextDate($task)->toDateString(),
            ] : null,
            'created_at' => $task->created_at?->toIso8601String(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'task_id' => $schema->string()
                ->description('Identificador (UUID) de la tarea.')
                ->required(),
        ];
    }
}
