<?php

namespace App\Mcp\Tools\Plan;

use App\Mcp\Tools\Plan\Concerns\ResolvesPlanTargets;
use App\Models\Plan;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los planes y lugares del usuario autenticado con sus círculos, personas, cuántas veces se han hecho y la última vez. Filtra por círculo, ciudad, tipo, estado o texto.')]
class ListPlansTool extends Tool
{
    use ResolvesPlanTargets;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            'circle_name' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'type' => ['nullable', 'string', 'in:'.implode(',', array_keys(Plan::TYPES))],
            'status' => ['nullable', 'string', 'in:'.implode(',', array_keys(Plan::STATUSES))],
            'query' => ['nullable', 'string'],
        ]);

        $circleId = $this->resolveCircleId($data['circle_name'] ?? null);
        if ($circleId instanceof Response) {
            return $circleId;
        }

        $plans = Auth::user()->plans()
            ->with(['circles', 'relationships', 'images'])
            ->withVisitStats()
            ->when($circleId, fn ($query) => $query->whereHas('circles', fn ($circles) => $circles->whereKey($circleId)))
            ->when(! empty($data['city']), fn ($query) => $query->where('city', 'like', "%{$data['city']}%"))
            ->when(! empty($data['type']), fn ($query) => $query->where('type', $data['type']))
            ->when(! empty($data['status']), fn ($query) => $query->where('status', $data['status']), fn ($query) => $query->where('status', '!=', 'archived'))
            ->when(! empty($data['query']), fn ($query) => $query->where(fn ($match) => $match
                ->where('title', 'like', "%{$data['query']}%")
                ->orWhere('category', 'like', "%{$data['query']}%")))
            ->orderBy('title')
            ->limit(50)
            ->get();

        return Response::structured([
            'plans' => $plans->map(fn (Plan $plan) => [
                'id' => $plan->id,
                'title' => $plan->title,
                'type' => $plan->type,
                'type_label' => $plan->typeLabel(),
                'category' => $plan->category,
                'city' => $plan->city,
                'status' => $plan->status,
                'scheduled_on' => $plan->scheduled_on?->toDateString(),
                'circles' => $plan->circles->pluck('name')->all(),
                'people' => $plan->relationships->map->displayName()->all(),
                'main_image_url' => $plan->mainImageUrl(),
                'visits_count' => (int) $plan->visits_count,
                'last_visited_on' => $plan->last_visited_on ? substr((string) $plan->last_visited_on, 0, 10) : null,
            ])->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'circle_name' => $schema->string()->description('Solo planes asociados a este círculo.'),
            'city' => $schema->string()->description('Filtra por ciudad.'),
            'type' => $schema->string()->enum(array_keys(Plan::TYPES))->description('Filtra por tipo de plan.'),
            'status' => $schema->string()->enum(array_keys(Plan::STATUSES))->description('Filtra por estado. Por defecto excluye archivados.'),
            'query' => $schema->string()->description('Texto a buscar en el título o la categoría.'),
        ];
    }
}
