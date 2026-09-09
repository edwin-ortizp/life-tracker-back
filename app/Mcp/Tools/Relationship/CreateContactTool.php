<?php

namespace App\Mcp\Tools\Relationship;

use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use App\Support\Birthday;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Crea un nuevo contacto (relación) para el usuario autenticado, opcionalmente con su cumpleaños.')]
class CreateContactTool extends Tool
{
    use ResolvesContact;

    private const CATEGORIES = ['familia', 'amigo', 'trabajo', 'pareja', 'otro'];

    public function handle(Request $request): Response
    {
        $currentYear = (int) now()->year;

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'nickname' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'in:'.implode(',', self::CATEGORIES)],
            'circle_name' => ['nullable', 'string'],
            'birthday_month' => ['nullable', 'integer', 'between:1,12', 'required_with:birthday_day'],
            'birthday_day' => ['nullable', 'integer', 'between:1,31', 'required_with:birthday_month'],
            'birthday_year' => ['nullable', 'integer', 'between:1900,'.$currentYear],
            'contact_frequency_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'general_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        if (isset($data['birthday_month'], $data['birthday_day']) && ! Birthday::isValidCombination($data['birthday_month'], $data['birthday_day'])) {
            return Response::error('La combinación de día y mes de cumpleaños no existe.');
        }

        $circleId = $this->resolveCircleId($data['circle_name'] ?? null);
        if ($circleId instanceof Response) {
            return $circleId;
        }

        $relationship = Auth::user()->relationships()->create([
            'full_name' => trim($data['full_name']),
            'nickname' => $data['nickname'] ?? null,
            'category' => $data['category'] ?? 'otro',
            'circle_id' => $circleId,
            'birthday_month' => $data['birthday_month'] ?? null,
            'birthday_day' => $data['birthday_day'] ?? null,
            'birthday_year' => $data['birthday_year'] ?? null,
            'contact_frequency_days' => $data['contact_frequency_days'] ?? null,
            'general_notes' => $data['general_notes'] ?? null,
        ]);

        $message = "Contacto creado: \"{$relationship->displayName()}\" (id: {$relationship->id}).";

        if ($birthday = $relationship->birthday()) {
            $message .= " Cumpleaños: {$birthday->label()}.";
        }

        return Response::text($message);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'full_name' => $schema->string()
                ->description('Nombre completo del contacto.')
                ->required(),
            'nickname' => $schema->string()
                ->description('Apodo o nombre corto.'),
            'category' => $schema->string()
                ->enum(self::CATEGORIES)
                ->description('Categoría del contacto. Por defecto "otro".'),
            'circle_name' => $schema->string()
                ->description('Nombre de un círculo existente al que pertenece el contacto.'),
            'birthday_month' => $schema->integer()
                ->description('Mes de cumpleaños (1-12).'),
            'birthday_day' => $schema->integer()
                ->description('Día de cumpleaños (1-31).'),
            'birthday_year' => $schema->integer()
                ->description('Año de nacimiento, opcional.'),
            'contact_frequency_days' => $schema->integer()
                ->description('Cada cuántos días se sugiere retomar contacto.'),
            'general_notes' => $schema->string()
                ->description('Notas generales sobre el contacto.'),
        ];
    }
}
