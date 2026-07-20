<?php

namespace App\Support;

use App\Models\VehicleMaintenancePlan;
use Carbon\Carbon;

class VehicleMaintenanceStatus
{
    public static function forPlan(VehicleMaintenancePlan $plan, ?Carbon $today = null, array|false|null $usageRate = null): array
    {
        $today ??= today();
        $lastLog = $plan->relationLoaded('latestMaintenanceLog')
            ? $plan->latestMaintenanceLog
            : ($plan->relationLoaded('maintenanceLogs')
                ? $plan->maintenanceLogs->sortByDesc('performed_on')->first()
                : $plan->maintenanceLogs()->latest('performed_on')->latest('created_at')->first());

        $baseDate = $lastLog?->performed_on ?? $plan->baseline_date;
        $baseUsage = $lastLog?->usage_reading ?? $plan->baseline_usage;
        $dueDate = $plan->interval_days && $baseDate ? Carbon::parse($baseDate)->addDays($plan->interval_days) : null;
        $dueUsage = $plan->interval_usage !== null && $baseUsage !== null
            ? (float) $baseUsage + (float) $plan->interval_usage : null;
        $currentUsage = $plan->vehicle?->current_usage;

        $dateDue = $dueDate && $today->greaterThanOrEqualTo($dueDate);
        $usageDue = $dueUsage !== null && $currentUsage !== null && (float) $currentUsage >= $dueUsage;
        $dateSoon = $dueDate && ! $dateDue && $today->greaterThanOrEqualTo($dueDate->copy()->subDays(30));
        $usageSoon = $dueUsage !== null && $currentUsage !== null && ! $usageDue
            && ($dueUsage - (float) $currentUsage) <= ((float) $plan->interval_usage * 0.10);
        $usageProjection = $usageRate === false
            ? null
            : ($usageRate
                ? VehicleUsageProjection::forDueUsageUsingRate($usageRate, $dueUsage)
                : VehicleUsageProjection::forDueUsage($plan->vehicle, $dueUsage, $today));
        $projectedUsageDate = $usageProjection['projected_date'] ?? null;
        $projectionSoon = $projectedUsageDate && ! $usageDue && $projectedUsageDate->lte($today->copy()->addDays(30));
        $nextDueDate = collect([$dueDate, $projectedUsageDate])->filter()->sort()->first();
        $nextDueReason = $nextDueDate
            ? ($projectedUsageDate && $nextDueDate->equalTo($projectedUsageDate) ? 'uso' : 'tiempo')
            : null;

        return [
            'status' => ($dateDue || $usageDue) ? 'vencido' : (($dateSoon || $usageSoon || $projectionSoon) ? 'proximo' : 'al_dia'),
            'due_date' => $dueDate,
            'due_usage' => $dueUsage,
            'usage_projection' => $usageProjection,
            'projected_usage_date' => $projectedUsageDate,
            'next_due_date' => $nextDueDate,
            'next_due_reason' => $nextDueReason,
            'projection_is_past' => $projectedUsageDate && ! $usageDue && $projectedUsageDate->lte($today),
            'last_log' => $lastLog,
        ];
    }
}
