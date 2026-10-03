<?php

namespace App\Mcp\Tools\Relationship;

use App\Mcp\Support\McpOutput;
use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Busca contactos por nombre, apodo o alias, categoría o círculo y devuelve su ficha (alias, círculo, cumpleaños, ciudad, datos de contacto). Úsala para identificar a una persona o conseguir su id. Al buscar por nombre gana la coincidencia exacta de alias o apodo: "Ali" devuelve a quien tiene ese alias y no a "Aliria". Para saber qué ha pasado con alguien (visitas, eventos, planes, tareas) usa get-person-context-tool.')]
class ListContactsTool extends Tool
{
    use ResolvesContact;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            'name' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
            'circle_name' => ['nullable', 'string'],
        ]);

        $circleId = $this->resolveCircleId($data['circle_name'] ?? null);
        if ($circleId instanceof Response) {
            return $circleId;
        }

        if (filled($data['name'] ?? null)) {
            $ids = $this->matchContacts($data['name'], activeOnly: true)->modelKeys();
            $query = Auth::user()->relationships()->whereKey($ids);
        } else {
            $query = Auth::user()->relationships()->active();
        }

        $contacts = $query
            ->with(['circle', 'aliases', 'contactMethods'])
            ->when(filled($data['category'] ?? null), fn ($query) => $query->where('category', $data['category']))
            ->when($circleId, fn ($query) => $query->where('circle_id', $circleId))
            ->orderBy('full_name')
            ->limit(50)
            ->get();

        return Response::structured(McpOutput::compact([
            'contacts' => $contacts->map(fn ($relationship) => [
                'id' => $relationship->id,
                'full_name' => $relationship->full_name,
                'nickname' => $relationship->nickname,
                'aliases' => $relationship->aliases->pluck('alias')->all(),
                'category' => $relationship->category,
                'circle' => $relationship->circle?->name,
                'birthday' => $relationship->birthday()?->label(),
                'contact_frequency_days' => $relationship->contact_frequency_days,
                'occupation' => $relationship->occupation,
                'organization' => $relationship->organization,
                'address' => $relationship->address,
                'city' => $relationship->city,
                'document' => $relationship->maskedDocument(),
                'contact_methods' => $relationship->contactMethods->map(fn ($method) => [
                    'id' => $method->id,
                    'type' => $method->type,
                    'label' => $method->label,
                    'value' => $method->value,
                    'is_primary' => $method->is_primary,
                ])->all(),
            ])->all(),
        ]));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()
                ->description('Nombre, apodo o alias. Primero busca coincidencia exacta, luego inicio de palabra y por último cualquier parte del texto.'),
            'category' => $schema->string()
                ->description('Filtra por categoría exacta (p. ej. familia, amigo, pareja, trabajo).'),
            'circle_name' => $schema->string()
                ->description('Filtra por círculo (p. ej. "Familia").'),
        ];
    }
}
