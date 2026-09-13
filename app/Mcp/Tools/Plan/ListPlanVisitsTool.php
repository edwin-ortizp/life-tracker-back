<?php

namespace App\Mcp\Tools\Plan;

use App\Mcp\Tools\Plan\Concerns\ResolvesPlanTargets;
use App\Models\PlanVisit;
use App\Models\Relationship;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Muestra el historial de visitas a planes del usuario, filtrado por plan y/o por persona. Sirve para responder "¿cuándo fuimos por última vez a…?" o "¿a dónde he ido con Ali?".')]
class ListPlanVisitsTool extends Tool
{
    use ResolvesPlanTargets;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            'plan_id' => ['nullable', 'string'],
            'plan_title' => ['nullable', 'string'],
            'contact_name' => ['nullable', 'string'],
        ]);

        $plan = null;
        if (! empty($data['plan_id']) || ! empty($data['plan_title'])) {
            $plan = $this->resolvePlan($data['plan_id'] ?? null, empty($data['plan_id']) ? $data['plan_title'] : null);
            if ($plan instanceof Response) {
                return $plan;
            }
        }

        $contact = null;
        if (! empty($data['contact_name'])) {
            $contact = $this->resolveContact(null, $data['contact_name']);
            if ($contact instanceof Response) {
                return $contact;
            }
        }

        $visits = PlanVisit::query()
            ->with(['plan', 'relationships'])
            ->whereHas('plan')
            ->when($plan, fn ($query) => $query->where('plan_id', $plan->id))
            ->when($contact, fn ($query) => $query->whereHas('relationships', fn ($people) => $people->whereKey($contact->id)))
            ->orderByDesc('visited_on')
            ->orderByDesc('created_at')
            ->limit(30)
            ->get();

        return Response::structured([
            'visits' => $visits->map(fn (PlanVisit $visit) => [
                'id' => $visit->id,
                'visited_on' => $visit->visited_on->toDateString(),
                'plan_id' => $visit->plan_id,
                'plan' => $visit->plan->title,
                'city' => $visit->plan->city,
                'people' => $visit->relationships->map(fn (Relationship $person) => $person->displayName())->all(),
                'comment' => $visit->comment,
            ])->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'plan_id' => $schema->string()->description('Id del plan.'),
            'plan_title' => $schema->string()->description('Nombre del plan o lugar.'),
            'contact_name' => $schema->string()->description('Persona con la que fue, por nombre, apodo o alias.'),
        ];
    }
}
