<?php

namespace App\Mcp\Tools\Meal;

use App\Mcp\Tools\Meal\Concerns\InteractsWithMeals;
use App\Services\Meal\RecipeCalculator;
use App\Services\Meal\RecipeIngredientData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Guarda una receta nueva con ingredientes, instrucciones y nutrición. Cada ingrediente se enlaza con un ítem de la lista de compras del mismo nombre (se crea si no existe, sin marcarlo para comprar), como hace la app. Revisa antes con list-recipes-tool que no exista.')]
class CreateRecipeTool extends Tool
{
    use InteractsWithMeals;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'meal_type' => ['nullable', 'string', Rule::in(array_keys(self::MEAL_TYPES))],
            'difficulty' => ['nullable', 'string', Rule::in(self::DIFFICULTIES)],
            'prep_time' => ['nullable', 'integer', 'min:0', 'max:1440'],
            'instructions' => ['nullable', 'string', 'max:20000'],
            'servings' => ['nullable', 'numeric', 'gt:0', 'max:999'],
            'calories' => ['nullable', 'numeric', 'min:0'],
            'protein' => ['nullable', 'numeric', 'min:0'],
            'carbs' => ['nullable', 'numeric', 'min:0'],
            'fat' => ['nullable', 'numeric', 'min:0'],
            'favorite' => ['nullable', 'boolean'],
            'ingredients' => ['nullable', 'array', 'max:60'],
            'ingredients.*.name' => ['required', 'string', 'max:255'],
            'ingredients.*.quantity' => ['required', 'numeric', 'gt:0', 'max:999999999.999'],
            'ingredients.*.unit' => ['nullable', 'string', 'max:50'],
            'ingredients.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (Auth::user()->recipes()->whereRaw('lower(name) = ?', [mb_strtolower(trim($data['name']))])->exists()) {
            return Response::error("Ya existe una receta llamada \"{$data['name']}\".");
        }

        $recipe = DB::transaction(function () use ($data) {
            $nutrition = array_filter([
                'calories' => $data['calories'] ?? null,
                'protein' => $data['protein'] ?? null,
                'carbs' => $data['carbs'] ?? null,
                'fat' => $data['fat'] ?? null,
            ], fn ($value) => $value !== null);

            $recipe = Auth::user()->recipes()->create([
                'name' => trim($data['name']),
                'description' => trim($data['description'] ?? '') ?: null,
                'difficulty' => $data['difficulty'] ?? 'facil',
                'prep_time' => $data['prep_time'] ?? null,
                'servings' => $data['servings'] ?? 1,
                'meal_type' => $data['meal_type'] ?? 'comida',
                'instructions' => trim($data['instructions'] ?? '') ?: null,
                'nutrition' => $nutrition ?: null,
                'favorite' => (bool) ($data['favorite'] ?? false),
            ]);

            foreach ($data['ingredients'] ?? [] as $ingredient) {
                $item = RecipeIngredientData::product($ingredient['name'], $ingredient['unit'] ?? null);
                [$quantity, $unit] = RecipeIngredientData::quantity($item, (float) $ingredient['quantity'], $ingredient['unit'] ?? null);

                $recipe->recipeIngredients()->create([
                    'shopping_item_id' => $item->id,
                    'quantity' => $quantity,
                    'unit' => $unit,
                    'notes' => filled($ingredient['notes'] ?? null) ? trim($ingredient['notes']) : null,
                ]);
            }

            app(RecipeCalculator::class)->refreshNutrition($recipe->refresh());

            return $recipe;
        });

        return Response::text("Receta guardada: \"{$recipe->name}\" con ".count($data['ingredients'] ?? []).' ingredientes, id: '.$recipe->id.'.');
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()->description('Nombre de la receta.')->required(),
            'description' => $schema->string()->description('Descripción corta.'),
            'meal_type' => $schema->string()->enum(array_keys(self::MEAL_TYPES))->description('Tipo de comida (por defecto comida).'),
            'difficulty' => $schema->string()->enum(self::DIFFICULTIES)->description('Dificultad (por defecto facil).'),
            'prep_time' => $schema->integer()->description('Tiempo de preparación en minutos.'),
            'instructions' => $schema->string()->description('Pasos de preparación.'),
            'servings' => $schema->number()->description('Porciones que rinde (por defecto 1). Las cantidades de ingredientes son para ese total.'),
            'calories' => $schema->number()->description('Calorías por porción (estimación manual; se reemplaza por el cálculo cuando todos los ingredientes tienen nutrición).'),
            'protein' => $schema->number()->description('Proteína por porción (g).'),
            'carbs' => $schema->number()->description('Carbohidratos por porción (g).'),
            'fat' => $schema->number()->description('Grasa por porción (g).'),
            'favorite' => $schema->boolean()->description('Marcar como favorita.'),
            'ingredients' => $schema->array()->items($schema->object([
                'name' => $schema->string()->description('Nombre del ingrediente, p. ej. "Pechuga de pollo".')->required(),
                'quantity' => $schema->number()->description('Cantidad.')->required(),
                'unit' => $schema->string()->description('Unidad: g, kg, ml, L, unidades, libra o docena. Se convierte a la unidad base del producto.'),
                'notes' => $schema->string()->description('Notas, p. ej. "picado".'),
            ]))->description('Ingredientes de la receta.'),
        ];
    }
}
