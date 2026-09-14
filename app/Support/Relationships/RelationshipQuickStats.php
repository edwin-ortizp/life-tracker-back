<?php

namespace App\Support\Relationships;

use App\Models\Plan;
use App\Models\PlanVisit;
use App\Models\Relationship;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * Indicadores compactos del panel derecho del detalle de una persona.
 */
final class RelationshipQuickStats
{
    private const FREQUENCIES = [1 => 'Cada día', 7 => 'Cada semana', 14 => 'Cada 2 semanas', 30 => 'Cada mes', 60 => 'Cada 2 meses', 90 => 'Cada 3 meses', 180 => 'Cada 6 meses', 365 => 'Cada año'];

    /**
     * @return list<array{label: string, value: string, tone: string, support: ?string}>
     */
    public static function for(Relationship $relationship, ?Carbon $reference = null): array
    {
        $today = ($reference ?? Carbon::today())->copy()->startOfDay();
        $days = $relationship->daysSinceLastContact($today);
        $overdue = $relationship->isFollowUpDue($today);

        $events = $relationship->relationshipEvents()->active()
            ->whereDate('starts_on', '>=', $today->copy()->startOfYear()->toDateString())
            ->whereDate('starts_on', '<=', $today->toDateString())
            ->count();
        $visits = PlanVisit::query()
            ->whereHas('relationships', fn (Builder $people) => $people->whereKey($relationship->id))
            ->whereDate('visited_on', '>=', $today->copy()->startOfYear()->toDateString())
            ->whereDate('visited_on', '<=', $today->toDateString())
            ->count();
        $pendingPlans = Plan::query()->forRelationship($relationship)->whereIn('status', ['pending', 'scheduled'])->count();

        return [
            [
                'label' => 'Último contacto',
                'value' => match (true) {
                    $days === null => 'Sin registro',
                    $days === 0 => 'Hoy',
                    default => 'Hace '.$days.' '.($days === 1 ? 'día' : 'días'),
                },
                'tone' => $overdue ? 'warning' : 'neutral',
                'support' => $overdue ? 'Seguimiento vencido' : null,
            ],
            ['label' => 'Frecuencia deseada', 'value' => self::frequencyLabel($relationship->effectiveContactFrequencyDays()), 'tone' => 'primary', 'support' => null],
            ['label' => 'Momentos este año', 'value' => (string) ($events + $visits), 'tone' => 'success', 'support' => null],
            ['label' => 'Planes pendientes', 'value' => (string) $pendingPlans, 'tone' => 'accent', 'support' => null],
        ];
    }

    public static function frequencyLabel(?int $days): string
    {
        if (! $days) {
            return 'Sin definir';
        }

        return self::FREQUENCIES[$days] ?? 'Cada '.$days.' días';
    }
}
