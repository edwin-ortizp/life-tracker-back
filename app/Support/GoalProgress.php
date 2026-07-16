<?php

namespace App\Support;

use Carbon\CarbonInterface;

class GoalProgress
{
    /**
     * Normalize the persisted KPI contract, including objectives created by
     * the previous application version.
     *
     * @return array{name: string, unit: string, direction: string, startValue: float, targetValue: float, currentValue: float}|null
     */
    public static function configuration(?array $numericGoal): ?array
    {
        if (! ($numericGoal['enabled'] ?? false)) {
            return null;
        }

        return [
            'name' => trim((string) ($numericGoal['name'] ?? 'Indicador principal')),
            'unit' => trim((string) ($numericGoal['unit'] ?? '')),
            'direction' => in_array($numericGoal['direction'] ?? null, ['increase', 'decrease'], true)
                ? $numericGoal['direction']
                : 'increase',
            'startValue' => (float) ($numericGoal['startValue'] ?? 0),
            'targetValue' => (float) ($numericGoal['targetValue'] ?? 0),
            'currentValue' => (float) ($numericGoal['currentValue'] ?? $numericGoal['startValue'] ?? 0),
        ];
    }

    /**
     * @return array{actualPercent: float, expectedPercent: float|null, expectedValue: float|null, currentValue: float, targetValue: float, startValue: float, onSchedule: bool|null}|null
     */
    public static function calculate(?array $numericGoal, ?CarbonInterface $startDate, ?CarbonInterface $dueDate, ?CarbonInterface $today = null): ?array
    {
        $configuration = self::configuration($numericGoal);

        if (! $configuration) {
            return null;
        }

        $distance = $configuration['targetValue'] - $configuration['startValue'];
        $actualPercent = $distance == 0.0
            ? 0.0
            : self::clamp((($configuration['currentValue'] - $configuration['startValue']) / $distance) * 100);

        if (! $startDate || ! $dueDate || $dueDate->lt($startDate)) {
            return [
                'actualPercent' => $actualPercent,
                'expectedPercent' => null,
                'expectedValue' => null,
                'currentValue' => $configuration['currentValue'],
                'targetValue' => $configuration['targetValue'],
                'startValue' => $configuration['startValue'],
                'onSchedule' => null,
            ];
        }

        $today ??= today();
        $totalDays = max(1, $startDate->copy()->startOfDay()->diffInDays($dueDate->copy()->startOfDay()));
        $elapsedDays = $startDate->copy()->startOfDay()->diffInDays($today->copy()->startOfDay(), false);
        $expectedPercent = self::clamp(($elapsedDays / $totalDays) * 100);
        $expectedValue = $configuration['startValue'] + ($distance * ($expectedPercent / 100));

        return [
            'actualPercent' => $actualPercent,
            'expectedPercent' => $expectedPercent,
            'expectedValue' => $expectedValue,
            'currentValue' => $configuration['currentValue'],
            'targetValue' => $configuration['targetValue'],
            'startValue' => $configuration['startValue'],
            'onSchedule' => $actualPercent >= $expectedPercent,
        ];
    }

    private static function clamp(float $value): float
    {
        return max(0, min(100, $value));
    }
}
