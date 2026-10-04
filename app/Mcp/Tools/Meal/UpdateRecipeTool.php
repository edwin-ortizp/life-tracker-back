<?php

namespace App\Mcp\Tools\Meal;

use App\Mcp\Tools\Meal\Concerns\InteractsWithMeals;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\ShoppingItem;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Edita una receta guardada: nombre, descripción, tipo de comida, dificultad, tiempo, instrucciones, nutrición, favorita e ingredientes. Solo cambia lo enviado. Para ingredientes: "ingredients" reemplaza la lista completa; "add_ingredients" agrega o actualiza la cantidad de los indicados; "remove_ingredients" quita por nombre. Lee antes la receta con list-recipes-tool.')]
class UpdateRecipeTool extends Tool
{
    use InteractsWithMeals;

    public function handle(Request $request): Response
    {
        $ingredientRules = fn (string $key) => [
            $key => ['nullable', 'array', 'max:60'],
            "{$key}.*.name" => ['required', 'string', 'max:255'],
            "{$key}.*.quantity" => ['required', 'numeric', 'gt:0', 'max:999999.99'],
            "{$key}.*.unit" => ['nullable', 'string', 'max:50'],
            "{$key}.*.notes" => ['nullable', 'string', 'max:1000'],
        ];

        $data = $request->validate([
            'recipe_id' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'new_name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'meal_type' => ['nullable', 'string', Rule::in(array_keys(self::MEAL_TYPES))],
            'difficulty' => ['nullable', 'string', Rule::in(self::DIFFICULTIES)],
            'prep_time' => ['nullable', 'integer', 'min:0', 'max:1440'],
            'instructions' => ['nullable', 'string', 'max:20000'],
            'calories' => ['nullable', 'numeric', 'min:0'],
            'protein' => ['nullable', 'numeric', 'min:0'],
            'carbs' => ['nullable', 'numeric', 'min:0'],
            'fat' => ['nullable', 'numeric', 'min:0'],
            'favorite' => ['nullable', 'boolean'],
            ...$ingredientRules('ingredients'),
            ...$ingredientRules('add_ingredients'),
            'remove_ingredients' => ['nullable', 'array', 'max:60'],
            'remove_ingredients.*' => ['string', 'max:255'],
        ]);

        $recipe = $this->resolveRecipe($data['recipe_id'] ?? null, $data['name'] ?? null);
        if ($recipe instanceof Response) {
            return $recipe;
        }

        if (filled($data['new_name'] ?? null)
            && Auth::user()->recipes()->whereKeyNot($recipe->id)->whereRaw('lower(name) = ?', [mb_strtolower(trim($data['new_name']))])->exists()) {
            return Response::error("Ya existe otra receta llamada \"{$data['new_name']}\".");
        }

        $recipe->load('recipeIngredients.shoppingItem');
        $current = $recipe->recipeIngredients->keyBy(fn (RecipeIngredient $ingredient) => mb_strtolower((string) $ingredient->shoppingItem?->name));

        $missing = collect($data['remove_ingredients'] ?? [])
            ->reject(fn (string $name) => $current->has(mb_strtolower(trim($name))));
        if ($missing->isNotEmpty()) {
            return Response::error('La receta no tiene: '.$missing->implode(', ').'. Ingredientes actuales: '.$current->keys()->implode(', ').'.');
        }

        $changes = [];

        DB::transaction(function () use ($recipe, $data, $current, &$changes) {
            $fields = [];
            if (filled($data['new_name'] ?? null)) {
                $fields['name'] = trim($data['new_name']);
            }
            foreach (['description', 'instructions'] as $text) {
                if (array_key_exists($text, $data) && $data[$text] !== null) {
                    $fields[$text] = trim($data[$text]) ?: null;
                }
            }
            foreach (['meal_type', 'difficulty', 'prep_time'] as $field) {
                if (isset($data[$field])) {
                    $fields[$field] = $data[$field];
                }
            }
            if (isset($data['favorite'])) {
                $fields['favorite'] = (bool) $data['favorite'];
            }

            $nutritionChanges = array_filter(array_intersect_key($data, array_flip(['calories', 'protein', 'carbs', 'fat'])), fn ($value) => $value !== null);
            if ($nutritionChanges !== []) {
                $fields['nutrition'] = [...($recipe->nutrition ?? []), ...$nutritionChanges];
            }

            if ($fields !== []) {
                $recipe->update($fields);
                $changes = array_keys($fields);
            }

            if (isset($data['ingredients'])) {
                $recipe->recipeIngredients()->delete();
                foreach ($data['ingredients'] as $ingredient) {
                    $this->saveIngredient($recipe, $ingredient);
                }
                $changes[] = 'ingredientes ('.count($data['ingredients']).')';
            }

            foreach ($data['add_ingredients'] ?? [] as $ingredient) {
                $existing = $current->get(mb_strtolower(trim($ingredient['name'])));
                $existing ? $existing->update([
                    'quantity' => $ingredient['quantity'],
                    'unit' => filled($ingredient['unit'] ?? null) ? trim($ingredient['unit']) : $existing->unit,
                    'notes' => filled($ingredient['notes'] ?? null) ? trim($ingredient['notes']) : $existing->notes,
                ]) : $this->saveIngredient($recipe, $ingredient);
            }
            if (! empty($data['add_ingredients'])) {
                $changes[] = 'agregados: '.collect($data['add_ingredients'])->pluck('name')->implode(', ');
            }

            foreach ($data['remove_ingredients'] ?? [] as $name) {
                $current->get(mb_strtolower(trim($name)))?->delete();
            }
            if (! empty($data['remove_ingredients'])) {
                $changes[] = 'quitados: '.implode(', ', $data['remove_ingredients']);
            }
        });

        if ($changes === []) {
            return Response::error('No enviaste ningún cambio.');
        }

        return Response::text("Receta actualizada: \"{$recipe->name}\" (".implode('; ', $changes)."), id: {$recipe->id}.");
    }

    private function saveIngredient(Recipe $recipe, array $ingredient): void
    {
        $item = ShoppingItem::firstOrCreate(
            ['name' => trim($ingredient['name'])],
            ['status' => 'available', 'stock' => 0, 'to_buy' => 0],
        );

        $recipe->recipeIngredients()->create([
            'shopping_item_id' => $item->id,
            'quantity' => $ingredient['quantity'],
            'unit' => filled($ingredient['unit'] ?? null) ? trim($ingredient['unit']) : null,
            'notes' => filled($ingredient['notes'] ?? null) ? trim($ingredient['notes']) : null,
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        $ingredient = fn () => $schema->object([
            'name' => $schema->string()->description('Nombre del ingrediente.')->required(),
            'quantity' => $schema->number()->description('Cantidad.')->required(),
            'unit' => $schema->string()->description('Unidad, p. ej. "g", "taza".'),
            'notes' => $schema->string()->description('Notas, p. ej. "picado".'),
        ]);

        return [
            'recipe_id' => $schema->string()->description('Id de la receta. Alternativa a "name".'),
            'name' => $schema->string()->description('Nombre actual de la receta.'),
            'new_name' => $schema->string()->description('Nuevo nombre.'),
            'description' => $schema->string()->description('Nueva descripción. "" la borra.'),
            'meal_type' => $schema->string()->enum(array_keys(self::MEAL_TYPES))->description('Tipo de comida.'),
            'difficulty' => $schema->string()->enum(self::DIFFICULTIES)->description('Dificultad.'),
            'prep_time' => $schema->integer()->description('Tiempo de preparación en minutos.'),
            'instructions' => $schema->string()->description('Reemplaza las instrucciones completas. "" las borra.'),
            'calories' => $schema->number()->description('Calorías por porción.'),
            'protein' => $schema->number()->description('Proteína por porción (g).'),
            'carbs' => $schema->number()->description('Carbohidratos por porción (g).'),
            'fat' => $schema->number()->description('Grasa por porción (g).'),
            'favorite' => $schema->boolean()->description('Marca o desmarca como favorita.'),
            'ingredients' => $schema->array()->items($ingredient())->description('Reemplaza TODA la lista de ingredientes.'),
            'add_ingredients' => $schema->array()->items($ingredient())->description('Agrega ingredientes; si ya existe uno con ese nombre, actualiza su cantidad.'),
            'remove_ingredients' => $schema->array()->items($schema->string())->description('Nombres de ingredientes a quitar.'),
        ];
    }
}
