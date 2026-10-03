<?php

namespace App\Mcp\Tools\Journal;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Escribe en el diario del usuario. Hay una entrada por día: por defecto el texto se AGREGA al final de la entrada de ese día sin borrar lo anterior (mode=append); mode=replace la reescribe completa. Úsala solo cuando el usuario pida guardar algo en su diario, con sus palabras; no resumas ni reinterpretes lo que escribió.')]
class WriteJournalEntryTool extends Tool
{
    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'max:20000'],
            'date' => ['nullable', 'date'],
            'mode' => ['nullable', 'string', Rule::in(['append', 'replace'])],
            'summary' => ['nullable', 'string', 'max:255'],
        ]);

        $date = $data['date'] ?? today()->toDateString();

        if ($date > today()->toDateString()) {
            return Response::error('No se puede escribir en el diario de un día futuro.');
        }

        $text = trim($data['text']);
        $entry = Auth::user()->journalEntries()->whereDate('date', $date)->first();
        $mode = $data['mode'] ?? 'append';

        $attributes = [
            'text' => $entry && $mode === 'append' && filled($entry->text) ? rtrim($entry->text)."\n\n".$text : $text,
            'display_time' => now()->format('H:i'),
        ];

        if (filled($data['summary'] ?? null)) {
            $attributes['summary'] = trim($data['summary']);
        }

        if ($entry) {
            $entry->update($attributes);
            $verb = $mode === 'append' ? 'agregado a' : 'reemplazado en';
        } else {
            Auth::user()->journalEntries()->create(['date' => $date, ...$attributes]);
            $verb = 'guardado en';
        }

        return Response::text("Texto {$verb} el diario del {$date}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'text' => $schema->string()->description('Lo que el usuario quiere escribir, con sus palabras.')->required(),
            'date' => $schema->string()->description('Día de la entrada (YYYY-MM-DD). Por defecto hoy.'),
            'mode' => $schema->string()->enum(['append', 'replace'])->description('append (por defecto) agrega al final; replace reescribe la entrada del día.'),
            'summary' => $schema->string()->description('Resumen de una línea del día (máx. 255). Si se omite, se conserva el que haya.'),
        ];
    }
}
