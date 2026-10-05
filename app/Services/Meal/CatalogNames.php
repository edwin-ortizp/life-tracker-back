<?php

namespace App\Services\Meal;

use App\Models\Brand;
use App\Models\Store;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Normaliza nombres del catálogo para que "D1", "d1" y "D1 " sean la misma tienda,
 * y propone coincidencias parecidas antes de crear registros nuevos.
 */
class CatalogNames
{
    public static function normalize(?string $value): string
    {
        $value = Str::ascii(Str::lower(trim((string) $value)));
        $value = preg_replace('/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/u', '', $value) ?? '';

        return preg_replace('/\s+/u', ' ', $value) ?? '';
    }

    public static function store(?string $name): ?Store
    {
        $name = trim((string) $name);
        if ($name === '') {
            return null;
        }

        return Store::firstOrCreate(['normalized_name' => self::normalize($name)], ['name' => $name]);
    }

    public static function brand(?string $name): ?Brand
    {
        $name = trim((string) $name);
        if ($name === '') {
            return null;
        }

        return Brand::firstOrCreate(['normalized_name' => self::normalize($name)], ['name' => $name]);
    }

    /**
     * Nombres existentes parecidos al dado (incluye los que solo difieren en tildes o mayúsculas).
     *
     * @param  iterable<string>  $existing
     */
    public static function similar(string $name, iterable $existing, int $limit = 3): Collection
    {
        $target = self::normalize($name);
        if (mb_strlen($target) < 3) {
            return collect();
        }

        return collect($existing)
            ->map(function (string $candidate) use ($target) {
                $normalized = self::normalize($candidate);
                similar_text($target, $normalized, $percent);
                $contains = $normalized === $target || str_contains($normalized, $target) || str_contains($target, $normalized);

                return ['name' => $candidate, 'normalized' => $normalized, 'score' => $contains ? max($percent, 80) : $percent];
            })
            ->filter(fn ($row) => $row['score'] >= 70)
            ->sortByDesc('score')
            ->take($limit)
            ->pluck('name')
            ->values();
    }
}
