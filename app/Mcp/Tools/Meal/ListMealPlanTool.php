<?php

namespace App\Mcp\Tools\Meal;

use App\Mcp\Support\DateWindow;
use App\Mcp\Support\McpOutput;
use App\Mcp\Tools\Meal\Concerns\InteractsWithMeals;
use App\Models\MealPlanEntry;
use App\Models\MealPlanEntryItem;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Plan de comidas del usuario por día y tipo de comida (desayuno, comida (onces de la mañana), almuerzo, merienda (tarde), cena), con recetas, porciones y calorías. Por defecto la semana actual (lunes a domingo). Úsala cuando hable de qué va a comer o qué comió, alimentación, calorías, mercado de la semana o antes de planear una comida.')]
class ListMealPlanTool extends Tool
{
    use InteractsWithMeals;

    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([...DateWindow::rules()]);

        if (blank($data['since'] ?? null) && blank($data['until'] ?? null)) {
            $today = Carbon::today(config('app.timezone'));
            $data['since'] = $today->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
            $data['until'] = $today->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();
        }

        $window = DateWindow::fromInput($data, 7);
        $order = array_flip(array_keys(self::MEAL_TYPES));

        $entries = Auth::user()->mealPlanEntries()
            ->with(['items.recipe', 'items.preparation'])
            ->whereDate('date', '>=', $window->fromDate())
            ->whereDate('date', '<=', $window->toDate())
            ->orderBy('date')
            ->get();

        $days = $entries->groupBy(fn (MealPlanEntry $entry) => $entry->date->toDateString())
            ->map(fn (Collection $day, string $date) => McpOutput::compact([
                'date' => $date,
                'calories' => (int) $day->where('status', 'planned')->sum(fn (MealPlanEntry $entry) => $entry->effective_calories) ?: null,
                'planned_calories' => (int) $day->where('status', 'planned')->sum(fn ($entry) => $entry->effective_calories),
                'consumed_calories' => (int) $day->where('status', 'consumed')->sum(fn ($entry) => $entry->consumption['calories'] ?? 0),
                'meals' => $day->sortBy(fn (MealPlanEntry $entry) => $order[$entry->meal_type] ?? 99)->map(fn (MealPlanEntry $entry) => McpOutput::compact([
                    'id' => $entry->id,
                    'meal_type' => $entry->meal_type,
                    'status' => $entry->status,
                    'consumed_at' => $entry->consumed_at?->toIso8601String(),
                    'consumption_mode' => $entry->consumption_mode,
                    'consumption' => $entry->consumption,
                    'components' => $entry->items->map(fn ($item) => ['id' => $item->id, 'recipe_id' => $item->recipe_id, 'preparation_id' => $item->preparation_id,
                        'name' => $item->recipe?->name ?? $item->name, 'portions' => $item->portions, 'calories' => $item->calories, 'ingredients' => $item->ingredients,
                        'preparation' => $item->preparation?->summary()])->all(),
                    'items' => $entry->items->map(fn (MealPlanEntryItem $item) => $item->recipe
                        ? $item->recipe->name.((float) $item->portions !== 1.0 ? ' ×'.(float) $item->portions : '')
                        : $item->name.($item->calories ? " ({$item->calories} kcal)" : ''))->all(),
                    'calories' => $entry->status === 'consumed' ? ($entry->consumption['calories'] ?? null) : ($entry->effective_calories ?: null),
                    'calories_incomplete' => $entry->hasIncompleteCalories() ? true : null,
                    'notes' => $entry->notes,
                ]))->values()->all(),
            ]))->values();

        return Response::structured(McpOutput::compact([
            'period' => $window->toArray(),
            'days_planned' => $days->count(),
            'days' => $days->all(),
        ]));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'since' => $schema->string()->description('Desde esta fecha (YYYY-MM-DD). Sin since ni until, la semana actual.'),
            'until' => $schema->string()->description('Hasta esta fecha (YYYY-MM-DD).'),
        ];
    }
}
