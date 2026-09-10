<?php

namespace App\Mcp\Tools\Relationship;

use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use App\Support\Birthday;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Actualiza campos de un contacto existente del usuario autenticado, por ejemplo para añadirle el cumpleaños.')]
class UpdateContactTool extends Tool
{
    use ResolvesContact;

    private const CATEGORIES = ['familia', 'amigo', 'trabajo', 'pareja', 'otro'];

    public function handle(Request $request): Response
    {
        $currentYear = (int) now()->year;

        $data = $request->validate([
            'contact_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'full_name' => ['sometimes', 'string', 'max:255'],
            'nickname' => ['sometimes', 'nullable', 'string', 'max:120'],
            'category' => ['sometimes', 'string', 'in:'.implode(',', self::CATEGORIES)],
            'circle_name' => ['sometimes', 'nullable', 'string'],
            'birthday_month' => ['sometimes', 'nullable', 'integer', 'between:1,12'],
            'birthday_day' => ['sometimes', 'nullable', 'integer', 'between:1,31'],
            'birthday_year' => ['sometimes', 'nullable', 'integer', 'between:1900,'.$currentYear],
            'contact_frequency_days' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:3650'],
            'general_notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $relationship = $this->resolveContact($data['contact_id'] ?? null, $data['name'] ?? null);
        if ($relationship instanceof Response) {
            return $relationship;
        }

        $month = $data['birthday_month'] ?? $relationship->birthday_month;
        $day = $data['birthday_day'] ?? $relationship->birthday_day;
        if ($month && $day && ! Birthday::isValidCombination($month, $day)) {
            return Response::error('La combinación de día y mes de cumpleaños no existe.');
        }

        $updates = array_intersect_key($data, array_flip([
            'full_name', 'nickname', 'category', 'birthday_month', 'birthday_day', 'birthday_year', 'contact_frequency_days', 'general_notes',
        ]));

        if (array_key_exists('circle_name', $data)) {
            $circleId = $this->resolveCircleId($data['circle_name']);
            if ($circleId instanceof Response) {
                return $circleId;
            }
            $updates['circle_id'] = $circleId;
        }

        if ($updates === []) {
            return Response::error('No se indicó ningún campo para actualizar.');
        }

        $relationship->update($updates);

        $message = "Contacto actualizado: \"{$relationship->displayName()}\" (id: {$relationship->id}).";

        if (array_key_exists('birthday_month', $updates) || array_key_exists('birthday_day', $updates)) {
            $birthday = $relationship->birthday();
            $message .= $birthday ? " Cumpleaños: {$birthday->label()}." : ' Cumpleaños eliminado.';
        }

        return Response::text($message);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'contact_id' => $schema->string()
                ->description('Identificador (UUID) del contacto. Alternativa a "name".'),
            'name' => $schema->string()
                ->description('Nombre o apodo del contacto a actualizar. Alternativa a "contact_id".'),
            'full_name' => $schema->string()
                ->description('Nuevo nombre completo.'),
            'nickname' => $schema->string()
                ->description('Nuevo apodo.'),
            'category' => $schema->string()
                ->enum(self::CATEGORIES)
                ->description('Nueva categoría del contacto.'),
            'circle_name' => $schema->string()
                ->description('Nombre de un círculo existente al que mover el contacto.'),
            'birthday_month' => $schema->integer()
                ->description('Mes de cumpleaños (1-12).'),
            'birthday_day' => $schema->integer()
                ->description('Día de cumpleaños (1-31).'),
            'birthday_year' => $schema->integer()
                ->description('Año de nacimiento, opcional.'),
            'contact_frequency_days' => $schema->integer()
                ->description('Cada cuántos días se sugiere retomar contacto.'),
            'general_notes' => $schema->string()
                ->description('Nuevas notas generales sobre el contacto.'),
        ];
    }
}
