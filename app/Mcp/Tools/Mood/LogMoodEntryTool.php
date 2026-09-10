<?php

namespace App\Mcp\Tools\Mood;

use App\Models\MoodState;
use App\Support\MoodLogger;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra un estado de ánimo del usuario autenticado, eligiendo de su catálogo de emociones por id o por texto/emoji aproximado.')]
class LogMoodEntryTool extends Tool
{
    public function handle(Request $request, MoodLogger $logger): Response
    {
        $data = $request->validate([
            'mood_state_id' => ['nullable', 'string'],
            'mood' => ['nullable', 'string'],
            'date' => ['nullable', 'date'],
            'intensity' => ['nullable', 'integer', 'between:1,5'],
            'situation' => ['nullable', 'string', 'max:500'],
        ]);

        $state = $this->resolveMoodState($data['mood_state_id'] ?? null, $data['mood'] ?? null);
        if ($state instanceof Response) {
            return $state;
        }

        $entry = $logger->record($state, $data['date'] ?? null);

        $context = array_filter([
            'intensity' => $data['intensity'] ?? null,
            'situation' => $data['situation'] ?? null,
        ], fn ($value) => $value !== null);

        if ($context !== []) {
            $entry->update($context);
        }

        return Response::text("Ánimo registrado: {$entry->emoji} {$entry->text} el {$entry->date->toDateString()}.");
    }

    private function resolveMoodState(?string $moodStateId, ?string $mood): MoodState|Response
    {
        if ($moodStateId) {
            $state = Auth::user()->moodStates()->active()->find($moodStateId);

            return $state ?? Response::error('No se encontró ese estado de ánimo en tu catálogo.');
        }

        if (! $mood) {
            return Response::error('Debes indicar mood_state_id o mood para identificar el estado de ánimo.');
        }

        $matches = Auth::user()->moodStates()->active()
            ->where(fn ($query) => $query->where('text', 'like', "%{$mood}%")->orWhere('emoji', $mood))
            ->get();

        if ($matches->isEmpty()) {
            return Response::error("No encontré ningún estado de ánimo que coincida con \"{$mood}\" en tu catálogo.");
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (MoodState $state) => "{$state->emoji} {$state->text} (id: {$state->id})")->implode(', ');

            return Response::error("Hay varios estados de ánimo que coinciden con \"{$mood}\": {$list}. Especifica el mood_state_id o un texto más preciso.");
        }

        return $matches->first();
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'mood_state_id' => $schema->string()
                ->description('Identificador (UUID) del estado de ánimo en el catálogo del usuario. Alternativa a "mood".'),
            'mood' => $schema->string()
                ->description('Texto (p. ej. "feliz") o emoji del estado de ánimo. Alternativa a "mood_state_id".'),
            'date' => $schema->string()
                ->description('Fecha en formato YYYY-MM-DD. Por defecto hoy.'),
            'intensity' => $schema->integer()
                ->description('Intensidad del ánimo (1-5).'),
            'situation' => $schema->string()
                ->description('Breve contexto o situación asociada.'),
        ];
    }
}
