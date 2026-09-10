<?php

namespace App\Mcp\Tools\Relationship;

use App\Models\Relationship;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los próximos cumpleaños de los contactos del usuario autenticado, ordenados por cercanía.')]
class ListUpcomingBirthdaysTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'within_days' => ['nullable', 'integer', 'min:0'],
        ]);

        $rows = Relationship::active()
            ->withBirthday()
            ->get()
            ->map(function (Relationship $relationship): array {
                $birthday = $relationship->birthday();

                return [
                    'id' => $relationship->id,
                    'name' => $relationship->displayName(),
                    'date' => $birthday->label(),
                    'days_until' => $birthday->daysUntil(),
                    'is_today' => $birthday->isToday(),
                    'age' => $birthday->ageOnNextOccurrence(),
                ];
            });

        if (isset($data['within_days'])) {
            $rows = $rows->filter(fn (array $row) => $row['days_until'] <= $data['within_days']);
        }

        $rows = $rows->sortBy('days_until')->values();

        return Response::structured(['birthdays' => $rows->all()]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'within_days' => $schema->integer()
                ->description('Solo cumpleaños dentro de este número de días. Si se omite, devuelve todos.'),
        ];
    }
}
