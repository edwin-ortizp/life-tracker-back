<?php

namespace App\Mcp\Tools\Task;

use App\Models\Task;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Crea una nueva tarea para el usuario autenticado.')]
class CreateTaskTool extends Tool
{
    // Debe reflejar los catálogos declarados en App\Livewire\Task\TaskList.
    private const CATEGORIES = [
        'siigo', 'entreagiles', 'gesthor', 'certmind', 'unicauca', 'personal',
        'salud', 'finanzas', 'educacion', 'hogar', 'social', 'creatividad',
        'tecnologia', 'compras', 'tramites', 'otros',
    ];

    private const PRIORITIES = [
        'urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important',
    ];

    private const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', Rule::in(self::CATEGORIES)],
            'priority' => ['nullable', 'string', Rule::in(self::PRIORITIES)],
            'size' => ['nullable', 'string', Rule::in(self::SIZES)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'is_private' => ['nullable', 'boolean'],
        ]);

        /** @var Task $task */
        $task = Auth::user()->tasks()->create([
            'task_code' => random_int(10000, 99999),
            'title' => trim($data['title']),
            'description' => $data['description'] ?? null,
            'category' => $data['category'] ?? null,
            'priority' => $data['priority'] ?? null,
            'size' => $data['size'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'is_private' => $data['is_private'] ?? false,
        ]);

        return Response::text("Tarea creada: \"{$task->title}\" (id: {$task->id}).");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'title' => $schema->string()
                ->description('Título de la tarea.')
                ->required(),
            'description' => $schema->string()
                ->description('Descripción opcional de la tarea.'),
            'category' => $schema->string()
                ->enum(self::CATEGORIES)
                ->description('Categoría de la tarea.'),
            'priority' => $schema->string()
                ->enum(self::PRIORITIES)
                ->description('Cuadrante de Eisenhower de la tarea.'),
            'size' => $schema->string()
                ->enum(self::SIZES)
                ->description('Tamaño estimado de la tarea (XS, S, M, L, XL).'),
            'start_date' => $schema->string()
                ->description('Fecha de inicio en formato YYYY-MM-DD.'),
            'end_date' => $schema->string()
                ->description('Fecha límite en formato YYYY-MM-DD.'),
            'is_private' => $schema->boolean()
                ->description('Si la tarea es privada.'),
        ];
    }
}
