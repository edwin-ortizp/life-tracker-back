<?php

namespace App\Mcp\Tools\Habit;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los hábitos del usuario autenticado y si están completados en una fecha dada (hoy por defecto).')]
class ListHabitsTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'date' => ['nullable', 'date'],
        ]);

        $date = $data['date'] ?? today()->toDateString();

        $habits = Auth::user()->habitDefinitions()->orderBy('base_time')->orderBy('id')->get();
        $completedIds = Auth::user()->habitCompletions()
            ->whereDate('date', $date)
            ->where('completed', true)
            ->pluck('habit_id');

        return Response::structured([
            'habits' => $habits->map(fn ($habit) => [
                'id' => $habit->id,
                'name' => $habit->name,
                'time_of_day' => $habit->time_of_day,
                'completed' => $completedIds->contains($habit->id),
            ])->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'date' => $schema->string()
                ->description('Fecha en formato YYYY-MM-DD para consultar el estado de completado. Por defecto hoy.'),
        ];
    }
}
