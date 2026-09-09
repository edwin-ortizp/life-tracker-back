<?php

namespace App\Mcp\Tools\Task;

use App\Services\TaskGamificationService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Marca una tarea del usuario autenticado como completada o pendiente.')]
class CompleteTaskTool extends Tool
{
    public function handle(Request $request, TaskGamificationService $gamification): Response
    {
        $data = $request->validate([
            'task_id' => ['required', 'string'],
            'action' => ['nullable', 'string', Rule::in(['complete', 'reopen', 'toggle'])],
        ]);

        $task = Auth::user()->tasks()->find($data['task_id']);

        if (! $task) {
            return Response::error('No se encontró la tarea o no te pertenece.');
        }

        $result = match ($data['action'] ?? 'toggle') {
            'complete' => $gamification->complete($task),
            'reopen' => $gamification->reopen($task),
            default => $gamification->toggle($task),
        };

        if ($result['completed']) {
            $xpMessage = isset($result['xp']) ? " (+{$result['xp']} XP)" : '';

            return Response::text("Tarea \"{$task->title}\" completada{$xpMessage}.");
        }

        return Response::text("Tarea \"{$task->title}\" marcada como pendiente.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'task_id' => $schema->string()
                ->description('Identificador (UUID) de la tarea.')
                ->required(),
            'action' => $schema->string()
                ->enum(['complete', 'reopen', 'toggle'])
                ->description('Acción a realizar. Por defecto alterna el estado actual.'),
        ];
    }
}
