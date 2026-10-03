<?php

namespace App\Mcp\Tools\Meal;

use App\Mcp\Tools\Meal\Concerns\InteractsWithMeals;
use App\Models\MealPlanEntry;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Planea o registra una comida en un día y tipo de comida: recetas guardadas (por id o nombre, con porciones) y/o elementos libres (nombre y calorías). Si ya hay algo planeado en ese día y tipo, por defecto se agregan los elementos (mode=append); mode=replace lo reemplaza. Sirve tanto para planear la semana como para anotar lo que comió.')]
class PlanMealTool extends Tool
{
    use InteractsWithMeals;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'date' => ['nullable', 'date'],
            'meal_type' => ['required', 'string', Rule::in(array_keys(self::MEAL_TYPES))],
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.recipe_id' => ['nullable', 'string'],
            'items.*.recipe' => ['nullable', 'string', 'max:255'],
            'items.*.name' => ['nullable', 'string', 'max:255'],
            'items.*.portions' => ['nullable', 'numeric', 'gt:0', 'max:50'],
            'items.*.calories' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'calories' => ['nullable', 'integer', 'min:0', 'max:20000'],
            'mode' => ['nullable', 'string', Rule::in(['append', 'replace'])],
        ]);

        $rows = [];
        foreach ($data['items'] as $index => $item) {
            if (filled($item['recipe_id'] ?? null) || filled($item['recipe'] ?? null)) {
                $recipe = $this->resolveRecipe($item['recipe_id'] ?? null, $item['recipe'] ?? null);
                if ($recipe instanceof Response) {
                    return $recipe;
                }
                $rows[] = ['recipe_id' => $recipe->id, 'name' => null, 'portions' => $item['portions'] ?? 1, 'calories' => null, 'label' => $recipe->name];
            } elseif (filled($item['name'] ?? null)) {
                $rows[] = ['recipe_id' => null, 'name' => trim($item['name']), 'portions' => null, 'calories' => $item['calories'] ?? null, 'label' => trim($item['name'])];
            } else {
                return Response::error('El elemento '.($index + 1).' necesita recipe_id, recipe o name.');
            }
        }

        $date = $data['date'] ?? today()->toDateString();
        $mode = $data['mode'] ?? 'append';

        $entry = DB::transaction(function () use ($data, $date, $mode, $rows) {
            $entry = Auth::user()->mealPlanEntries()
                ->whereDate('date', $date)
                ->where('meal_type', $data['meal_type'])
                ->with('items')
                ->first();

            if ($entry && $mode === 'replace') {
                $entry->items()->delete();
                $entry->update(['notes' => $data['notes'] ?? null, 'calories' => $data['calories'] ?? null]);
                $entry->setRelation('items', collect());
            } elseif ($entry) {
                $updates = array_filter([
                    'notes' => filled($data['notes'] ?? null) ? trim(($entry->notes ? $entry->notes."\n" : '').$data['notes']) : null,
                    'calories' => $data['calories'] ?? null,
                ], fn ($value) => $value !== null);
                $updates === [] || $entry->update($updates);
            } else {
                $entry = MealPlanEntry::create([
                    'date' => $date,
                    'meal_type' => $data['meal_type'],
                    'notes' => filled($data['notes'] ?? null) ? trim($data['notes']) : null,
                    'calories' => $data['calories'] ?? null,
                ]);
                $entry->setRelation('items', collect());
            }

            // Una receta no se repite dentro de la misma comida: se suman porciones.
            $position = (int) $entry->items->max('position') + ($entry->items->isEmpty() ? 0 : 1);
            foreach ($rows as $row) {
                $existing = $row['recipe_id'] ? $entry->items->firstWhere('recipe_id', $row['recipe_id']) : null;
                if ($existing) {
                    $existing->update(['portions' => (float) $existing->portions + (float) $row['portions']]);

                    continue;
                }
                $entry->items->push($entry->items()->create([
                    'recipe_id' => $row['recipe_id'],
                    'name' => $row['name'],
                    'portions' => $row['portions'],
                    'calories' => $row['calories'],
                    'position' => $position++,
                ]));
            }

            return $entry;
        });

        $entry->load('items.recipe');
        $label = self::MEAL_TYPES[$data['meal_type']];

        return Response::text("{$label} del {$date}: ".collect($rows)->pluck('label')->implode(', ')
            .'. Calorías estimadas: '.$entry->effective_calories.' kcal (id: '.$entry->id.').');
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'date' => $schema->string()->description('Fecha (YYYY-MM-DD). Por defecto hoy.'),
            'meal_type' => $schema->string()->enum(array_keys(self::MEAL_TYPES))->description('Tipo de comida.')->required(),
            'items' => $schema->array()->items($schema->object([
                'recipe_id' => $schema->string()->description('Id de una receta guardada.'),
                'recipe' => $schema->string()->description('Nombre de una receta guardada.'),
                'name' => $schema->string()->description('Elemento libre que no es receta, p. ej. "Banano".'),
                'portions' => $schema->number()->description('Porciones de la receta (por defecto 1).'),
                'calories' => $schema->integer()->description('Calorías del elemento libre.'),
            ]))->description('Recetas y/o elementos libres de la comida.')->required(),
            'notes' => $schema->string()->description('Notas de la comida.'),
            'calories' => $schema->integer()->description('Calorías totales, si se conocen; reemplaza el cálculo automático.'),
            'mode' => $schema->string()->enum(['append', 'replace'])->description('append (por defecto) agrega a lo ya planeado en ese día y tipo; replace lo reemplaza.'),
        ];
    }
}
