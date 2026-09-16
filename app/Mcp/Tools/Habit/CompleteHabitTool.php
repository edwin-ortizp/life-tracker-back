<?php

namespace App\Mcp\Tools\Habit;

use App\Services\HabitGamificationService;
use App\Support\Habits\HabitActionField;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Alterna el estado de completado de un hábito del usuario autenticado para una fecha dada (hoy por defecto). Si el hábito está configurado para registrar algo en otro módulo y falta información, la respuesta indica qué enviar en "action_input".')]
class CompleteHabitTool extends Tool
{
    public function handle(Request $request, HabitGamificationService $gamification): Response
    {
        $data = $request->validate([
            'habit_id' => ['required', 'integer'],
            'date' => ['nullable', 'date'],
            'action_input' => ['nullable', 'array'],
        ]);

        $habit = Auth::user()->habitDefinitions()->find($data['habit_id']);

        if (! $habit) {
            return Response::error('No se encontró el hábito o no te pertenece.');
        }

        $date = $data['date'] ?? today()->toDateString();
        $result = $gamification->toggle($habit->id, $date);
        $message = $result['message'];

        if ($result['requiresInput']) {
            $input = $data['action_input'] ?? [];

            if ($input === []) {
                return Response::text($message.' '.$this->missingInputHint($result['promptFields']));
            }

            try {
                $resolved = $gamification->resolveAction($habit->id, $date, $input);
            } catch (ValidationException $exception) {
                return Response::error(
                    'No pude registrar la acción asociada: '
                    .implode(' ', Arr::flatten($exception->errors()))
                    .' '.$this->missingInputHint($result['promptFields']),
                );
            }

            return Response::text(trim($message.' '.($resolved['actionResult'] ?? '')));
        }

        return Response::text(trim($message.' '.($result['actionResult'] ?? '')));
    }

    /** @param array<int, array<string, mixed>> $fields */
    private function missingInputHint(array $fields): string
    {
        $described = collect($fields)
            ->map(fn (array $field) => (new HabitActionField(
                key: $field['key'],
                label: $field['label'],
                type: $field['type'],
                options: $field['options'],
            ))->describe())
            ->implode(' | ');

        return "Este hábito registra en otro módulo y necesita datos: vuelve a llamarme con \"action_input\" conteniendo {$described}.";
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'habit_id' => $schema->integer()
                ->description('Identificador del hábito.')
                ->required(),
            'date' => $schema->string()
                ->description('Fecha en formato YYYY-MM-DD. Por defecto hoy.'),
            'action_input' => $schema->object()
                ->description('Datos de la acción asociada, cuando el hábito está configurado para pedirlos. Usa "list-habits-tool" para ver qué campos espera cada hábito.'),
        ];
    }
}
