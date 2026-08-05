<?php

namespace App\Support;

use App\Models\MoodEntry;
use App\Models\Relationship;
use Illuminate\Support\Carbon;

/**
 * Descriptive aggregations only. These summaries count what the user recorded; they never
 * score a person, rank a relationship or state that anybody caused an emotion.
 */
final class RelationshipEmotionalPatterns
{
    public const PERIODS = [
        7 => 'Últimos 7 días',
        30 => 'Últimos 30 días',
        90 => 'Últimos 90 días',
        365 => 'Último año',
    ];

    public static function periodDays(int $days): int
    {
        return array_key_exists($days, self::PERIODS) ? $days : 30;
    }

    /**
     * @return array{
     *     days: int, from: string, to: string, sample_size: int,
     *     emotions: list<array{text: string, emoji: string, count: int, share: float}>,
     *     intensity: array{recorded: int, distribution: array<int, int>, average: float|null},
     *     reflection_shift: array{sample_size: int, decreased: int, unchanged: int, increased: int}
     * }
     */
    public static function summarize(Relationship $relationship, int $days = 30, ?Carbon $reference = null): array
    {
        $days = self::periodDays($days);
        $to = ($reference ?? Carbon::today())->copy()->startOfDay();
        $from = $to->copy()->subDays($days - 1);

        $entries = $relationship->moodEntries()
            ->with('reflection')
            ->whereDate('date', '>=', $from->toDateString())
            ->whereDate('date', '<=', $to->toDateString())
            ->get();

        return [
            'days' => $days,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'sample_size' => $entries->count(),
            'emotions' => self::emotions($entries),
            'intensity' => self::intensity($entries),
            'reflection_shift' => self::reflectionShift($entries),
        ];
    }

    /** @param \Illuminate\Support\Collection<int, MoodEntry> $entries */
    private static function emotions($entries): array
    {
        $total = $entries->count();

        if ($total === 0) {
            return [];
        }

        return $entries->groupBy('text')
            ->map(fn ($group, string $text) => [
                'text' => $text,
                'emoji' => $group->first()->emoji,
                'count' => $group->count(),
                'share' => round(($group->count() / $total) * 100, 1),
            ])
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    /** @param \Illuminate\Support\Collection<int, MoodEntry> $entries */
    private static function intensity($entries): array
    {
        $recorded = $entries->filter(fn (MoodEntry $entry) => $entry->intensity !== null);
        $distribution = array_fill_keys(range(1, 5), 0);

        foreach ($recorded as $entry) {
            $distribution[$entry->intensity]++;
        }

        return [
            'recorded' => $recorded->count(),
            'distribution' => $distribution,
            'average' => $recorded->isEmpty() ? null : round($recorded->avg('intensity'), 1),
        ];
    }

    /**
     * Before/after comparison across reflections that recorded both numbers. Nothing is
     * framed as success or failure — an unchanged intensity is a normal outcome.
     *
     * @param \Illuminate\Support\Collection<int, MoodEntry> $entries
     */
    private static function reflectionShift($entries): array
    {
        $comparable = $entries->filter(
            fn (MoodEntry $entry) => $entry->intensity !== null && $entry->reflection?->intensity_after !== null
        );

        return [
            'sample_size' => $comparable->count(),
            'decreased' => $comparable->filter(fn ($e) => $e->reflection->intensity_after < $e->intensity)->count(),
            'unchanged' => $comparable->filter(fn ($e) => $e->reflection->intensity_after === $e->intensity)->count(),
            'increased' => $comparable->filter(fn ($e) => $e->reflection->intensity_after > $e->intensity)->count(),
        ];
    }
}
