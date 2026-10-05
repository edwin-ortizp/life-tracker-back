<?php

namespace App\Services\Meal;

use App\Models\Brand;
use App\Models\Store;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Normaliza nombres del catálogo para que "D1", "d1" y "D1 " sean la misma tienda o marca,
 * y propone coincidencias parecidas antes de crear registros nuevos.
 * Las tiendas son un catálogo cerrado: se buscan con findStore() y solo se crean con createStore().
 */
class CatalogNames
{
    public static function normalize(?string $value): string
    {
        $value = Str::ascii(Str::lower(trim((string) $value)));
        $value = preg_replace('/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/u', '', $value) ?? '';

        return preg_replace('/\s+/u', ' ', $value) ?? '';
    }

    /** Tienda del catálogo con ese nombre (sin distinguir mayúsculas ni tildes). Nunca crea una nueva. */
    public static function findStore(?string $name): ?Store
    {
        $normalized = self::normalize($name);

        return $normalized === '' ? null : Store::where('normalized_name', $normalized)->first();
    }

    /**
     * Crea una tienda en el catálogo. Rechaza nombres vacíos, repetidos o muy parecidos a uno existente
     * ("Exito" frente a "Éxito Popayán") salvo que se fuerce.
     *
     * @throws \InvalidArgumentException con el motivo, listo para mostrar.
     */
    public static function createStore(string $name, bool $allowSimilar = false): Store
    {
        $name = trim($name);
        if ($name === '') {
            throw new \InvalidArgumentException('El nombre de la tienda es obligatorio.');
        }

        if ($existing = self::findStore($name)) {
            throw new \InvalidArgumentException("La tienda \"{$existing->name}\" ya existe.");
        }

        $similar = self::similar($name, Store::pluck('name'));
        if (! $allowSimilar && $similar->isNotEmpty()) {
            throw new \InvalidArgumentException('Ya hay tiendas parecidas: '.$similar->implode(', ').'. Usa una de ellas o confirma que es otra tienda.');
        }

        return Store::create(['name' => $name]);
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
        if (mb_strlen($target) < 2) {
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
