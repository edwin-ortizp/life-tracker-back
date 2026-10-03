<?php

namespace App\Mcp\Tools\Goal;

use App\Mcp\Tools\Goal\Concerns\ResolvesGoal;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Crea una meta u objetivo. Opcionalmente con un indicador numérico (p. ej. "Peso" en kg de 82 a 76, o "Libros leídos" de 0 a 12), que exige fechas de inicio y límite para calcular si va a tiempo. Busca primero con list-goals-tool para no duplicar.')]
class CreateGoalTool extends Tool
{
    use ResolvesGoal;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'indicator_name' => ['nullable', 'string', 'max:120'],
            'indicator_unit' => ['nullable', 'string', 'max:50'],
            'indicator_direction' => ['nullable', 'string', Rule::in(['increase', 'decrease'])],
            'indicator_start' => ['nullable', 'numeric'],
            'indicator_target' => ['nullable', 'numeric'],
        ]);

        $hasIndicator = filled($data['indicator_name'] ?? null);

        if ($hasIndicator) {
            foreach (['indicator_unit', 'indicator_start', 'indicator_target', 'start_date', 'due_date'] as $field) {
                if (! isset($data[$field]) || $data[$field] === '') {
                    return Response::error("Una meta con indicador requiere {$field}.");
                }
            }
            if ((float) $data['indicator_start'] === (float) $data['indicator_target']) {
                return Response::error('El valor inicial y el objetivo del indicador deben ser distintos.');
            }
        }

        if (filled($data['start_date'] ?? null) && filled($data['due_date'] ?? null) && $data['due_date'] < $data['start_date']) {
            return Response::error('La fecha límite no puede ser anterior a la de inicio.');
        }

        $direction = $data['indicator_direction']
            ?? ($hasIndicator && (float) $data['indicator_target'] < (float) $data['indicator_start'] ? 'decrease' : 'increase');

        $goal = Auth::user()->goals()->create([
            'title' => trim($data['title']),
            'description' => trim($data['description'] ?? '') ?: null,
            'status' => 'active',
            'start_date' => $data['start_date'] ?? null,
            'due_date' => $data['due_date'] ?? null,
            'numeric_goal' => $hasIndicator ? [
                'enabled' => true,
                'name' => trim($data['indicator_name']),
                'unit' => trim($data['indicator_unit']),
                'direction' => $direction,
                'startValue' => (float) $data['indicator_start'],
                'targetValue' => (float) $data['indicator_target'],
                'currentValue' => (float) $data['indicator_start'],
            ] : null,
        ]);

        return Response::text("Meta creada: \"{$goal->title}\", id: {$goal->id}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'title' => $schema->string()->description('Título de la meta.')->required(),
            'description' => $schema->string()->description('Para qué y cómo; contexto de la meta.'),
            'start_date' => $schema->string()->description('Fecha de inicio (YYYY-MM-DD).'),
            'due_date' => $schema->string()->description('Fecha límite (YYYY-MM-DD).'),
            'indicator_name' => $schema->string()->description('Nombre del indicador numérico, p. ej. "Peso". Si lo envías, los demás campos indicator_* y las fechas son obligatorios.'),
            'indicator_unit' => $schema->string()->description('Unidad del indicador, p. ej. "kg".'),
            'indicator_direction' => $schema->string()->enum(['increase', 'decrease'])->description('Si el valor debe subir o bajar. Se infiere de inicio y objetivo si no se envía.'),
            'indicator_start' => $schema->number()->description('Valor inicial del indicador.'),
            'indicator_target' => $schema->number()->description('Valor objetivo del indicador.'),
        ];
    }
}
