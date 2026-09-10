<?php

namespace App\Mcp\Tools\Relationship;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los contactos del usuario autenticado, con filtros opcionales de nombre y categoría.')]
class ListContactsTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'name' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
        ]);

        $query = Auth::user()->relationships()->with('circle')->active();

        if (! empty($data['name'])) {
            $name = $data['name'];
            $query->where(fn ($q) => $q->where('full_name', 'like', "%{$name}%")->orWhere('nickname', 'like', "%{$name}%"));
        }

        if (! empty($data['category'])) {
            $query->where('category', $data['category']);
        }

        $contacts = $query->orderBy('full_name')->limit(50)->get();

        return Response::structured([
            'contacts' => $contacts->map(fn ($relationship) => [
                'id' => $relationship->id,
                'full_name' => $relationship->full_name,
                'nickname' => $relationship->nickname,
                'category' => $relationship->category,
                'circle' => $relationship->circle?->name,
                'birthday' => $relationship->birthday()?->label(),
                'contact_frequency_days' => $relationship->contact_frequency_days,
            ])->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()
                ->description('Filtra por nombre o apodo.'),
            'category' => $schema->string()
                ->description('Filtra por categoría exacta.'),
        ];
    }
}
