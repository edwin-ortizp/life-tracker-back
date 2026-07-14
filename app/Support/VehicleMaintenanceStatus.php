<?php

namespace App\Support;

use App\Models\VehicleMaintenancePlan;
use Carbon\Carbon;

class VehicleMaintenanceStatus
{
    public static function forPlan(VehicleMaintenancePlan $plan, ?Carbon $today = null): array
    {
        $today ??= today();
        $lastLog = $plan->relationLoaded('maintenanceLogs')
            ? $plan->maintenanceLogs->sortByDesc('performed_on')->first()
            : $plan->maintenanceLogs()->latest('performed_on')->first();

        $baseDate = $lastLog?->performed_on ?? $plan->baseline_date;
        $baseUsage = $lastLog?->usage_reading ?? $plan->baseline_usage;
        $dueDate = $plan->interval_days && $baseDate ? Carbon::parse($baseDate)->addDays($plan->interval_days) : null;
        $dueUsage = $plan->interval_usage !== null && $baseUsage !== null
            ? (float) $baseUsage + (float) $plan->interval_usage : null;
        $currentUsage = $plan->vehicle?->current_usage;

        $dateDue = $dueDate && $today->greaterThanOrEqualTo($dueDate);
        $usageDue = $dueUsage !== null && $currentUsage !== null && (float) $currentUsage >= $dueUsage;
        $dateSoon = $dueDate && !$dateDue && $today->greaterThanOrEqualTo($dueDate->copy()->subDays(30));
        $usageSoon = $dueUsage !== null && $currentUsage !== null && !$usageDue
            && ($dueUsage - (float) $currentUsage) <= ((float) $plan->interval_usage * 0.10);

        return [
            'status' => ($dateDue || $usageDue) ? 'vencido' : (($dateSoon || $usageSoon) ? 'proximo' : 'al_dia'),
            'due_date' => $dueDate,
            'due_usage' => $dueUsage,
            'last_log' => $lastLog,
        ];
    }
}
