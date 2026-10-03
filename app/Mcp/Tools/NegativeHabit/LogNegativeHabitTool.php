<?php

namespace App\Mcp\Tools\NegativeHabit;

use App\Models\NegativeHabitDefinition;
use App\Models\NegativeHabitLog;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra una vez que el usuario cayó en un hábito negativo (por id o nombre), con una nota opcional sobre el contexto o el detonante. Úsala solo cuando el usuario lo pida o lo cuente con intención de registrarlo.')]
class LogNegativeHabitTool extends Tool
{
    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'habit_id' => ['nullable', 'integer'],
            'habit' => ['nullable', 'string'],
            'note' => ['nullable', 'string', 'max:1000'],
            'at' => ['nullable', 'date'],
        ]);

        $habit = $this->resolveHabit($data['habit_id'] ?? null, $data['habit'] ?? null);
        if ($habit instanceof Response) {
            return $habit;
        }

        $at = filled($data['at'] ?? null) ? Carbon::parse($data['at'], config('app.timezone')) : now();
        if ($at->isFuture()) {
            return Response::error('No se puede registrar en el futuro.');
        }

        NegativeHabitLog::create([
            'habit_id' => $habit->id,
            'timestamp' => $at->timestamp,
            'note' => filled($data['note'] ?? null) ? trim($data['note']) : null,
        ]);

        $week = NegativeHabitLog::query()->where('habit_id', $habit->id)
            ->whereBetween('timestamp', [now()->startOfWeek()->timestamp, now()->endOfWeek()->timestamp])->count();

        return Response::text("Registrado \"{$habit->name}\" el ".$at->format('Y-m-d H:i').". Esta semana: {$week}.");
    }

    private function resolveHabit(?int $habitId, ?string $name): NegativeHabitDefinition|Response
    {
        if ($habitId) {
            return Auth::user()->negativeHabitDefinitions()->find($habitId) ?? Response::error('No se encontró ese hábito negativo.');
        }

        if (blank($name)) {
            return Response::error('Debes indicar habit_id o habit (nombre).');
        }

        $exact = Auth::user()->negativeHabitDefinitions()->whereRaw('lower(name) = ?', [mb_strtolower(trim($name))])->get();
        $matches = $exact->isNotEmpty()
            ? $exact
            : Auth::user()->negativeHabitDefinitions()->where('name', 'like', '%'.addcslashes(trim($name), '%_').'%')->get();

        if ($matches->count() === 1) {
            return $matches->first();
        }

        $all = Auth::user()->negativeHabitDefinitions()->pluck('name')->implode(', ');

        return Response::error($matches->isEmpty()
            ? "No encontré un hábito negativo llamado \"{$name}\". Tus hábitos negativos: ".($all ?: 'ninguno').'.'
            : "Hay varios que coinciden con \"{$name}\": ".$matches->map(fn ($habit) => "{$habit->name} (id: {$habit->id})")->implode(', ').'.');
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'habit_id' => $schema->integer()->description('Id del hábito negativo.'),
            'habit' => $schema->string()->description('Nombre del hábito negativo. Alternativa a habit_id.'),
            'note' => $schema->string()->description('Contexto o detonante, con las palabras del usuario.'),
            'at' => $schema->string()->description('Fecha y hora (YYYY-MM-DD HH:MM). Por defecto ahora.'),
        ];
    }
}
