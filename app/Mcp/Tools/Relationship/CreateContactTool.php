<?php

namespace App\Mcp\Tools\Relationship;

use App\Mcp\Tools\Relationship\Concerns\ResolvesContact;
use App\Models\Relationship;
use App\Models\RelationshipContactMethod;
use App\Support\Birthday;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Crea un nuevo contacto (relación) para el usuario autenticado, opcionalmente con su cumpleaños, ciudad, dirección, documento y medios de contacto (teléfonos, correos y redes sociales).')]
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
            'pronouns' => ['nullable', 'string', 'max:60'],
            'occupation' => ['nullable', 'string', 'max:150'],
            'organization' => ['nullable', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'document_type' => ['nullable', 'string', 'in:'.implode(',', array_keys(Relationship::DOCUMENT_TYPES))],
            'document_number' => ['nullable', 'string', 'max:40'],
            'contact_methods' => ['nullable', 'array', 'max:20'],
            'contact_methods.*.type' => ['required', 'string', 'in:'.implode(',', array_keys(RelationshipContactMethod::TYPES))],
            'contact_methods.*.value' => ['required', 'string', 'max:255'],
            'contact_methods.*.label' => ['nullable', 'string', 'max:60'],
            'contact_methods.*.is_primary' => ['nullable', 'boolean'],
        ]);

        if (! empty($data['document_number']) && empty($data['document_type'])) {
            return Response::error('Indica document_type junto con document_number.');
        }

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
            'pronouns' => $data['pronouns'] ?? null,
            'occupation' => $data['occupation'] ?? null,
            'organization' => $data['organization'] ?? null,
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'document_type' => $data['document_type'] ?? null,
            'document_number' => $data['document_number'] ?? null,
        ]);

        foreach (array_values($data['contact_methods'] ?? []) as $position => $method) {
            $relationship->contactMethods()->create([
                'type' => $method['type'],
                'value' => trim($method['value']),
                'label' => isset($method['label']) ? trim($method['label']) : null,
                'is_primary' => (bool) ($method['is_primary'] ?? false),
                'sort_order' => $position,
            ]);
        }

        $message = "Contacto creado: \"{$relationship->displayName()}\" (id: {$relationship->id}).";

        if ($birthday = $relationship->birthday()) {
            $message .= " Cumpleaños: {$birthday->label()}.";
        }

        if (! empty($data['contact_methods'])) {
            $message .= ' Medios de contacto: '.count($data['contact_methods']).'.';
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
            'pronouns' => $schema->string()
                ->description('Pronombres, opcional.'),
            'occupation' => $schema->string()
                ->description('Ocupación o profesión.'),
            'organization' => $schema->string()
                ->description('Empresa, universidad u organización.'),
            'address' => $schema->string()
                ->description('Dirección de residencia.'),
            'city' => $schema->string()
                ->description('Ciudad donde vive.'),
            'document_type' => $schema->string()
                ->enum(array_keys(Relationship::DOCUMENT_TYPES))
                ->description('Tipo de documento: cc (cédula de ciudadanía), ce (cédula de extranjería), ti (tarjeta de identidad), passport, ppt, nit u other.'),
            'document_number' => $schema->string()
                ->description('Número de documento. Se guarda cifrado; requiere document_type.'),
            'contact_methods' => $schema->array()
                ->items($schema->object([
                    'type' => $schema->string()->enum(array_keys(RelationshipContactMethod::TYPES))->required(),
                    'value' => $schema->string()->required(),
                    'label' => $schema->string(),
                    'is_primary' => $schema->boolean(),
                ]))
                ->description('Medios de contacto iniciales. Ej. [{"type":"phone","value":"+57 310 555 0142","label":"Personal"},{"type":"instagram","value":"@cami"}].'),
        ];
    }
}
