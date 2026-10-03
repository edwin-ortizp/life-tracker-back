<?php

namespace App\Mcp\Tools\Mood;

use App\Mcp\Support\DateWindow;
use App\Mcp\Support\McpOutput;
use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use App\Models\MoodEntry;
use App\Models\Relationship;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registros de estado de ánimo del usuario en un periodo (por defecto los últimos 14 días): emoción, valor, intensidad, situación y personas asociadas, más un resumen con promedio y emociones más frecuentes. Úsala cuando hable de cómo se ha sentido, estrés, tristeza o una racha emocional, o para cruzar el ánimo con salud o con una persona.')]
class ListMoodEntriesTool extends Tool
{
    use ResolvesContact;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            ...DateWindow::rules(),
            'days' => ['nullable', 'integer', 'min:1', 'max:366'],
            'contact_name' => ['nullable', 'string'],
            'summary_only' => ['nullable', 'boolean'],
            'include_reflections' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $window = DateWindow::fromInput($data, $data['days'] ?? 14);

        $contact = null;
        if (filled($data['contact_name'] ?? null)) {
            $contact = $this->resolveContact(null, $data['contact_name']);
            if ($contact instanceof Response) {
                return $contact;
            }
        }

        $entries = Auth::user()->moodEntries()
            ->with(empty($data['include_reflections']) ? ['relationships'] : ['relationships', 'reflection'])
            ->whereDate('date', '>=', $window->fromDate())
            ->whereDate('date', '<=', $window->toDate())
            ->when($contact, fn ($query) => $query->whereHas('relationships', fn ($people) => $people->whereKey($contact->id)))
            ->orderByDesc('date')
            ->orderByDesc('timestamp')
            ->get();

        $values = $entries->pluck('value')->filter(fn ($value) => is_numeric($value))->map(fn ($value) => (float) $value);

        return Response::structured(McpOutput::compact([
            'period' => $window->toArray(),
            'summary' => [
                'entries' => $entries->count(),
                'days_with_entries' => $entries->pluck('date')->map->toDateString()->unique()->count(),
                'average_value' => $values->isEmpty() ? null : round($values->avg(), 2),
                'top_emotions' => $entries->groupBy('text')
                    ->map(fn ($group, $text) => ['emotion' => trim($group->first()->emoji.' '.$text), 'count' => $group->count()])
                    ->sortByDesc('count')->take(5)->values()->all(),
            ],
            'entries' => ! empty($data['summary_only']) ? null : $entries->take($data['limit'] ?? 60)->map(fn (MoodEntry $entry) => [
                'date' => $entry->date->toDateString(),
                'time' => $entry->time,
                'emotion' => trim($entry->emoji.' '.$entry->text),
                'value' => is_numeric($entry->value) ? (float) $entry->value : null,
                'intensity' => $entry->intensity,
                'situation' => $entry->situation,
                'people' => $entry->relationships->isEmpty() ? null : $entry->relationships->map(fn (Relationship $person) => $person->displayName())->all(),
                'reflection' => ! empty($data['include_reflections']) && $entry->reflection?->hasAnyAnswer() ? McpOutput::compact([
                    'thought' => $entry->reflection->automatic_thought,
                    'evidence_for' => $entry->reflection->evidence_for,
                    'evidence_against' => $entry->reflection->evidence_against,
                    'balanced_perspective' => $entry->reflection->balanced_perspective,
                    'intensity_after' => $entry->reflection->intensity_after,
                    'next_step' => $entry->reflection->next_step,
                ]) : null,
            ])->values()->all(),
        ]));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'since' => $schema->string()->description('Desde esta fecha (YYYY-MM-DD).'),
            'until' => $schema->string()->description('Hasta esta fecha (YYYY-MM-DD). Por defecto hoy.'),
            'days' => $schema->integer()->description('Días hacia atrás si no envías since (por defecto 14).'),
            'contact_name' => $schema->string()->description('Solo registros asociados a esta persona.'),
            'summary_only' => $schema->boolean()->description('Devuelve solo el resumen, sin cada registro.'),
            'include_reflections' => $schema->boolean()->description('Incluye las reflexiones guiadas (pensamiento, evidencias, perspectiva equilibrada, intensidad después). Solo si el tema lo requiere.'),
            'limit' => $schema->integer()->description('Máximo de registros a listar (por defecto 60).'),
        ];
    }
}
