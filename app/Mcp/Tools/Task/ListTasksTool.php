<?php

namespace App\Mcp\Tools\Task;

use App\Models\Task;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista las tareas del usuario autenticado, con filtros opcionales de estado, categoría (o sin categoría), texto (título, descripción y referencias), referencia externa exacta y fecha de última modificación. Para leer la descripción completa de una tarea usa get-task-tool.')]
class ListTasksTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', Rule::in(['pending', 'completed', 'all'])],
            'category' => ['nullable', 'string'],
            'uncategorized' => ['nullable', 'boolean'],
            'search' => ['nullable', 'string', 'max:120'],
            'external_ref' => ['nullable', 'string', 'max:255'],
            'external_provider' => ['nullable', 'string', 'max:40'],
            'updated_since' => ['nullable', 'date'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
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
            $term = '%'.addcslashes(trim($data['search']), '%_').'%';
            $query->where(fn ($query) => $query
                ->where('title', 'like', $term)
                ->orWhere('description', 'like', $term)
                ->orWhere('external_refs', 'like', $term));
        }

        if (filled($data['updated_since'] ?? null)) {
            $since = Carbon::parse($data['updated_since'], config('app.timezone'))->startOfDay();
            $query->where(fn ($query) => $query
                ->where('updated_at', '>=', $since)
                ->orWhere('completed_at', '>=', $since));
        }

        $limit = $data['limit'] ?? 30;

        if (filled($data['external_ref'] ?? null)) {
            // El prefiltro es por texto; aquí se exige la coincidencia exacta del id.
            $tasks = $query->withExternalRef($data['external_ref'], $data['external_provider'] ?? null)->get()
                ->filter(fn (Task $task) => $task->hasExternalRef($data['external_ref'], $data['external_provider'] ?? null))
                ->take($limit)
                ->values();
        } else {
            $tasks = $query->limit($limit)->get();
        }

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
                'external_refs' => $task->external_refs ?? [],
                'completed_at' => $task->completed_at?->toIso8601String(),
                'updated_at' => $task->updated_at?->toIso8601String(),
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
                ->description('Texto contenido en el título, la descripción o las referencias externas.'),
            'external_ref' => $schema->string()
                ->description('Id exacto de una referencia externa, p. ej. "SGX-323". Encuentra la tarea vinculada sin depender del título.'),
            'external_provider' => $schema->string()
                ->description('Limita external_ref a un proveedor (jira, google_calendar...).'),
            'updated_since' => $schema->string()
                ->description('Solo tareas modificadas o completadas desde esta fecha (YYYY-MM-DD). Útil para resúmenes de actividad.'),
            'limit' => $schema->integer()
                ->description('Máximo de tareas a devolver (por defecto 30, máximo 100).'),
        ];
    }
}
