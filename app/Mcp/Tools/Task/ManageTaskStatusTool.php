<?php

namespace App\Mcp\Tools\Task;

use App\Actions\ManageTaskStatuses;
use App\Models\TaskStatus;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use InvalidArgumentException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista, crea, edita o elimina los estados de tareas del usuario. Cada estado tiene un nombre libre y un tipo: todo (por hacer/borrador), ready (listo para ejecutar), in_progress (en curso) o done (terminado, único y fijo). Puede haber varios estados de los tres primeros tipos. Al eliminar un estado con tareas indica reassign_to; confirma con el usuario antes de eliminar.')]
class ManageTaskStatusTool extends Tool
{
    public function handle(Request $request, ManageTaskStatuses $statuses): Response|ResponseFactory
    {
        $data = $request->validate([
            'action' => ['required', 'string', Rule::in(['list', 'create', 'update', 'delete'])],
            'status' => ['required_if:action,update,delete', 'nullable', 'string', 'max:60'],
            'name' => ['required_if:action,create', 'nullable', 'string', 'max:60'],
            'type' => ['required_if:action,create', 'nullable', 'string', Rule::in(array_keys(TaskStatus::TYPES))],
            'reassign_to' => ['nullable', 'string', 'max:60'],
        ]);

        $userId = Auth::id();

        if ($data['action'] === 'list') {
            $counts = Auth::user()->tasks()->selectRaw('status_id, COUNT(*) as total')->groupBy('status_id')->pluck('total', 'status_id');

            return Response::structured([
                'statuses' => TaskStatus::ensureFor($userId)->map(fn (TaskStatus $status) => [
                    'id' => $status->id,
                    'name' => $status->name,
                    'type' => $status->type,
                    'type_label' => $status->type_label,
                    'tasks' => (int) ($counts[$status->id] ?? 0),
                ])->values()->all(),
            ]);
        }

        try {
            if ($data['action'] === 'create') {
                $status = $statuses->create(Auth::user(), $data['name'], $data['type']);

                return Response::text("Estado \"{$status->name}\" creado ({$status->type}, id: {$status->id}).");
            }

            $status = TaskStatus::resolve($userId, $data['status']);
            if (! $status) {
                return Response::error($this->notFound($data['status']));
            }

            if ($data['action'] === 'update') {
                if (blank($data['name'] ?? null) && blank($data['type'] ?? null)) {
                    return Response::error('Envía name o type para actualizar el estado.');
                }
                $previous = $status->name;
                $statuses->update($status, $data['name'] ?? $status->name, $data['type'] ?? null);

                return Response::text("Estado \"{$previous}\" actualizado: \"{$status->name}\" ({$status->type}).");
            }

            $target = null;
            if (filled($data['reassign_to'] ?? null)) {
                $target = TaskStatus::resolve($userId, $data['reassign_to']);
                if (! $target) {
                    return Response::error($this->notFound($data['reassign_to']));
                }
            }

            $moved = $statuses->delete($status, $target);
        } catch (InvalidArgumentException $exception) {
            return Response::error($exception->getMessage());
        }

        return Response::text("Estado \"{$status->name}\" eliminado.".($moved ? " {$moved} tareas pasaron a \"{$target->name}\"." : ''));
    }

    private function notFound(string $value): string
    {
        $available = TaskStatus::ensureFor(Auth::id())->map(fn (TaskStatus $status) => "{$status->name} ({$status->type})")->implode(', ');

        return "El estado \"{$value}\" no existe. Disponibles: {$available}.";
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'action' => $schema->string()
                ->enum(['list', 'create', 'update', 'delete'])
                ->description('Operación a realizar.')
                ->required(),
            'status' => $schema->string()
                ->description('Nombre o id del estado existente (update y delete).'),
            'name' => $schema->string()
                ->description('Nombre del nuevo estado o nuevo nombre (create y update).'),
            'type' => $schema->string()
                ->enum(array_keys(TaskStatus::TYPES))
                ->description('Tipo del estado (create; en update permite moverlo entre todo, ready e in_progress). No se puede crear otro done.'),
            'reassign_to' => $schema->string()
                ->description('Nombre o id del estado al que pasan las tareas al eliminar (obligatorio si tiene tareas; no puede ser done).'),
        ];
    }
}
