<?php

namespace App\Mcp\Tools\Relationship;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los círculos de contactos del usuario autenticado (por ejemplo Pareja, Familia, Amigos), con cuántos contactos y planes tiene cada uno. Úsala antes de asociar un contacto o un plan a un círculo.')]
class ListCirclesTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $circles = Auth::user()->circles()
            ->withCount(['relationships', 'plans'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Response::structured([
            'circles' => $circles->map(fn ($circle) => [
                'id' => $circle->id,
                'name' => $circle->name,
                'description' => $circle->description,
                'contact_frequency_days' => $circle->contact_frequency_days,
                'contacts_count' => $circle->relationships_count,
                'plans_count' => $circle->plans_count,
            ])->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
