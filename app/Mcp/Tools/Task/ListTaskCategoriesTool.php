<?php

namespace App\Mcp\Tools\Task;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista las categorías de tareas del usuario (key, nombre y tareas pendientes). Úsala para preguntar o sugerir la categoría al crear o clasificar tareas.')]
class ListTaskCategoriesTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $user = Auth::user();
        $pending = $user->tasks()->where('completed', false)->where('is_recurrence_history', false)
            ->selectRaw('category, COUNT(*) as total')->groupBy('category')->pluck('total', 'category');

        return Response::structured([
            'categories' => $user->taskCategories()->orderBy('sort_order')->orderBy('name')->get()
                ->map(fn ($category) => [
                    'key' => $category->key,
                    'name' => $category->name,
                    'pending_tasks' => (int) ($pending[$category->key] ?? 0),
                ])->all(),
            'uncategorized_pending_tasks' => (int) ($pending[''] ?? 0),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
