<?php

namespace App\Mcp\Tools\Task;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista las tareas del usuario autenticado, con filtros opcionales de estado, categoría (o sin categoría) y texto. Para leer la descripción completa de una tarea usa get-task-tool.')]
class ListTasksTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', Rule::in(['pending', 'completed', 'all'])],
            'category' => ['nullable', 'string'],
            'uncategorized' => ['nullable', 'boolean'],
            'search' => ['nullable', 'string', 'max:120'],
        ]);

        $query = Auth::user()->tasks()->chronological();
        $status = $data['status'] ?? 'pending';

        if ($status === 'pending') {
            $query->where('completed', false);
        } elseif ($status === 'completed') {
            $query->where('completed', true);
        }

        if (! empty($data['uncategorized'])) {
            $query->where(fn ($query) => $query->whereNull('category')->orWhere('category', ''));
        } elseif (! empty($data['category'])) {
            $query->where('category', $data['category']);
        }

        if (filled($data['search'] ?? null)) {
            $query->where('title', 'like', '%'.trim($data['search']).'%');
        }

        $tasks = $query->limit(30)->get();

        return Response::structured([
            'tasks' => $tasks->map(fn ($task) => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'priority' => $task->priority,
                'size' => $task->size,
                'completed' => $task->completed,
                'start_date' => $task->start_date?->toDateString(),
                'end_date' => $task->end_date?->toDateString(),
                'is_recurrent' => $task->is_recurrent,
                'has_description' => filled($task->description),
                'subtasks' => $task->subtask_progress,
            ])->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()
                ->enum(['pending', 'completed', 'all'])
                ->description('Filtra por estado. Por defecto solo pendientes.'),
            'category' => $schema->string()
                ->description('Filtra por key de categoría exacta.'),
            'uncategorized' => $schema->boolean()
                ->description('Solo tareas sin categoría (útil para clasificarlas).'),
            'search' => $schema->string()
                ->description('Texto contenido en el título.'),
        ];
    }
}
