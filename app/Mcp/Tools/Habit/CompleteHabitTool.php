<?php

namespace App\Mcp\Tools\Habit;

use App\Services\HabitGamificationService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Alterna el estado de completado de un hábito del usuario autenticado para una fecha dada (hoy por defecto).')]
class CompleteHabitTool extends Tool
{
    public function handle(Request $request, HabitGamificationService $gamification): Response
    {
        $data = $request->validate([
            'habit_id' => ['required', 'integer'],
            'date' => ['nullable', 'date'],
        ]);

        $habit = Auth::user()->habitDefinitions()->find($data['habit_id']);

        if (! $habit) {
            return Response::error('No se encontró el hábito o no te pertenece.');
        }

        $result = $gamification->toggle($habit->id, $data['date'] ?? today()->toDateString());

        return Response::text($result['message']);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'habit_id' => $schema->integer()
                ->description('Identificador del hábito.')
                ->required(),
            'date' => $schema->string()
                ->description('Fecha en formato YYYY-MM-DD. Por defecto hoy.'),
        ];
    }
}
