<?php

namespace App\Mcp\Tools\Plan;

use App\Mcp\Support\DateWindow;
use App\Mcp\Support\McpOutput;
use App\Mcp\Tools\Plan\Concerns\ResolvesPlanTargets;
use App\Models\PlanVisit;
use App\Models\Relationship;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Historial de visitas a planes y lugares (qué se hizo, cuándo, con quién y comentarios), filtrable por plan, persona, ciudad y fechas. Úsala para "¿cuándo fuimos por última vez a…?", "¿a dónde he ido con Ali?" o antes de recomendar un plan, para no repetir lo reciente. Más reciente primero.')]
class ListPlanVisitsTool extends Tool
{
    use ResolvesPlanTargets;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            'plan_id' => ['nullable', 'string'],
            'plan_title' => ['nullable', 'string'],
            'contact_id' => ['nullable', 'string'],
            'contact_name' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            ...DateWindow::rules(),
        ]);

        $plan = null;
        if (! empty($data['plan_id']) || ! empty($data['plan_title'])) {
            $plan = $this->resolvePlan($data['plan_id'] ?? null, empty($data['plan_id']) ? $data['plan_title'] : null);
            if ($plan instanceof Response) {
                return $plan;
            }
        }

        $contact = null;
        if (! empty($data['contact_id']) || ! empty($data['contact_name'])) {
            $contact = $this->resolveContact($data['contact_id'] ?? null, empty($data['contact_id']) ? $data['contact_name'] : null);
            if ($contact instanceof Response) {
                return $contact;
            }
        }

        $visits = PlanVisit::query()
            ->with(['plan', 'relationships'])
            ->whereHas('plan', fn ($plans) => $plans->when(
                filled($data['city'] ?? null),
                fn ($query) => $query->where('city', 'like', '%'.addcslashes($data['city'], '%_').'%'),
            ))
            ->when($plan, fn ($query) => $query->where('plan_id', $plan->id))
            ->when($contact, fn ($query) => $query->whereHas('relationships', fn ($people) => $people->whereKey($contact->id)))
            ->when(filled($data['since'] ?? null), fn ($query) => $query->whereDate('visited_on', '>=', $data['since']))
            ->when(filled($data['until'] ?? null), fn ($query) => $query->whereDate('visited_on', '<=', $data['until']))
            ->orderByDesc('visited_on')
            ->orderByDesc('created_at')
            ->limit($data['limit'] ?? 30)
            ->get();

        return Response::structured(McpOutput::compact([
            'visits' => $visits->map(fn (PlanVisit $visit) => [
                'id' => $visit->id,
                'visited_on' => $visit->visited_on->toDateString(),
                'plan_id' => $visit->plan_id,
                'plan' => $visit->plan->title,
                'city' => $visit->plan->city,
                'people' => $visit->relationships->map(fn (Relationship $person) => $person->displayName())->all(),
                'comment' => $visit->comment,
            ])->all(),
        ]));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'plan_id' => $schema->string()->description('Id del plan.'),
            'plan_title' => $schema->string()->description('Nombre del plan o lugar.'),
            'contact_id' => $schema->string()->description('Id de la persona con la que fue. Preferible a contact_name cuando ya lo tienes.'),
            'contact_name' => $schema->string()->description('Persona con la que fue, por nombre, apodo o alias.'),
            'city' => $schema->string()->description('Solo visitas a planes de esta ciudad.'),
            'since' => $schema->string()->description('Desde esta fecha (YYYY-MM-DD).'),
            'until' => $schema->string()->description('Hasta esta fecha (YYYY-MM-DD).'),
            'limit' => $schema->integer()->description('Máximo de visitas (por defecto 30, máximo 100).'),
        ];
    }
}
