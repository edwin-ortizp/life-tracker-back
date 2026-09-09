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

#[Description('Lista las tareas del usuario autenticado, con filtros opcionales de estado y categoría.')]
class ListTasksTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', Rule::in(['pending', 'completed', 'all'])],
            'category' => ['nullable', 'string'],
        ]);

        $query = Auth::user()->tasks()->chronological();
        $status = $data['status'] ?? 'pending';

        if ($status === 'pending') {
            $query->where('completed', false);
        } elseif ($status === 'completed') {
            $query->where('completed', true);
        }

        if (! empty($data['category'])) {
            $query->where('category', $data['category']);
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
                ->description('Filtra por categoría exacta.'),
        ];
    }
}
