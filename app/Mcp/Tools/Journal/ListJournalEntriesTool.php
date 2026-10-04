<?php

namespace App\Mcp\Tools\Journal;

use App\Mcp\Support\DateWindow;
use App\Mcp\Support\McpOutput;
use App\Models\JournalEntry;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lee el diario personal del usuario (una entrada por día, con texto y un resumen corto). Por defecto devuelve los resúmenes de los últimos 14 días; con date o detail=full trae el texto completo. Úsala cuando pregunte qué escribió, qué pasó cierto día o semana, o para entender cómo ha estado en sus propias palabras. Es contenido íntimo: úsalo solo para el tema que se está tratando.')]
class ListJournalEntriesTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'date' => ['nullable', 'date'],
            ...DateWindow::rules(),
            'days' => ['nullable', 'integer', 'min:1', 'max:366'],
            'search' => ['nullable', 'string', 'max:120'],
            'detail' => ['nullable', 'string', Rule::in(['summary', 'excerpt', 'full'])],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        if (filled($data['date'] ?? null)) {
            $data['since'] = $data['until'] = $data['date'];
            $data['detail'] ??= 'full';
        }

        $window = DateWindow::fromInput($data, $data['days'] ?? 14);
        $detail = $data['detail'] ?? 'summary';

        $entries = Auth::user()->journalEntries()
            ->whereDate('date', '>=', $window->fromDate())
            ->whereDate('date', '<=', $window->toDate())
            ->when(filled($data['search'] ?? null), function ($query) use ($data) {
                $like = '%'.addcslashes(trim($data['search']), '%_').'%';
                $query->where(fn ($match) => $match->where('text', 'like', $like)->orWhere('summary', 'like', $like));
            })
            ->orderByDesc('date')
            ->limit($data['limit'] ?? 31)
            ->get();

        return Response::structured(McpOutput::compact([
            'period' => $window->toArray(),
            'days_written' => $entries->count(),
            'entries' => $entries->map(fn (JournalEntry $entry) => McpOutput::compact([
                'id' => $entry->id,
                'date' => $entry->date->toDateString(),
                'summary' => $entry->summary,
                'text' => match ($detail) {
                    'full' => $entry->text,
                    'excerpt' => McpOutput::excerpt($entry->text, 400),
                    // Sin resumen, un extracto corto evita que el día quede vacío.
                    default => blank($entry->summary) ? McpOutput::excerpt($entry->text, 200) : null,
                },
                'words' => str_word_count(strip_tags((string) $entry->text)),
            ]))->all(),
        ]));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'date' => $schema->string()->description('Un día concreto (YYYY-MM-DD); devuelve el texto completo.'),
            'since' => $schema->string()->description('Desde esta fecha (YYYY-MM-DD).'),
            'until' => $schema->string()->description('Hasta esta fecha (YYYY-MM-DD). Por defecto hoy.'),
            'days' => $schema->integer()->description('Días hacia atrás si no envías since (por defecto 14).'),
            'search' => $schema->string()->description('Texto a buscar en las entradas y sus resúmenes.'),
            'detail' => $schema->string()->enum(['summary', 'excerpt', 'full'])->description('summary (por defecto): solo resúmenes. excerpt: extracto de 400 caracteres. full: texto completo.'),
            'limit' => $schema->integer()->description('Máximo de entradas (por defecto 31).'),
        ];
    }
}
