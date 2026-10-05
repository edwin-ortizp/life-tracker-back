<?php

namespace App\Services\Meal;

/**
 * Conversiones aceptadas al registrar cantidades. Todo se guarda en la unidad base del producto: g, ml o unit.
 */
class UnitConverter
{
    public const BASE_UNITS = [
        'g' => 'Gramos (g)',
        'ml' => 'Mililitros (ml)',
        'unit' => 'Unidades',
    ];

    /** Factor hacia la unidad base, por alias de unidad (sin tildes, minúsculas). */
    private const FACTORS = [
        'g' => ['g' => 1, 'gr' => 1, 'grs' => 1, 'gramo' => 1, 'gramos' => 1, 'kg' => 1000, 'kilo' => 1000, 'kilos' => 1000, 'kilogramo' => 1000, 'kilogramos' => 1000, 'lb' => 500, 'libra' => 500, 'libras' => 500, 'mg' => 0.001],
        'ml' => ['ml' => 1, 'mililitro' => 1, 'mililitros' => 1, 'cc' => 1, 'l' => 1000, 'lt' => 1000, 'lts' => 1000, 'litro' => 1000, 'litros' => 1000],
        'unit' => ['unit' => 1, 'u' => 1, 'und' => 1, 'unds' => 1, 'unidad' => 1, 'unidades' => 1, 'pieza' => 1, 'piezas' => 1, 'docena' => 12, 'docenas' => 12, 'carton' => 30, 'cartones' => 30],
    ];

    public static function normalizeUnit(?string $unit): string
    {
        return trim(preg_replace('/[^a-z]/', '', \Illuminate\Support\Str::ascii(mb_strtolower((string) $unit))) ?? '');
    }

    /** Unidad base a la que pertenece una unidad escrita ("kg" → g), o null si no se reconoce. */
    public static function baseUnitOf(?string $unit): ?string
    {
        $unit = self::normalizeUnit($unit);
        foreach (self::FACTORS as $base => $factors) {
            if (isset($factors[$unit])) {
                return $base;
            }
        }

        return null;
    }

    /**
     * Convierte una cantidad a la unidad base del producto. Una unidad vacía se asume ya en unidad base.
     * Si el producto es por peso y tiene gramos por pieza, acepta piezas. Devuelve null si no es convertible.
     */
    public static function toBase(float $quantity, ?string $unit, string $baseUnit, ?float $gramsPerPiece = null): ?float
    {
        $normalized = self::normalizeUnit($unit);
        if ($normalized === '') {
            return round($quantity, 3);
        }

        $factor = self::FACTORS[$baseUnit][$normalized] ?? null;
        if ($factor !== null) {
            return round($quantity * $factor, 3);
        }

        if ($baseUnit === 'g' && $gramsPerPiece && self::baseUnitOf($normalized) === 'unit') {
            return round($quantity * self::FACTORS['unit'][$normalized] * $gramsPerPiece, 3);
        }

        return null;
    }

    /** Lee textos como "900 ml", "1,5 kg" o "x30" y devuelve [cantidad, unidad base]. */
    public static function parse(string $text): ?array
    {
        if (! preg_match('/(\d+(?:[.,]\d+)?)\s*([a-zA-Záéíóú]+)/u', $text, $matches)) {
            return null;
        }

        $base = self::baseUnitOf($matches[2]);
        if ($base === null) {
            return null;
        }

        $quantity = self::toBase((float) str_replace(',', '.', $matches[1]), $matches[2], $base);

        return [$quantity, $base];
    }

    /** Divisor de presentación del precio comparable: por 100 g, por litro o por unidad. */
    public static function comparisonSize(string $baseUnit): int
    {
        return match ($baseUnit) {
            'g' => 100,
            'ml' => 1000,
            default => 1,
        };
    }

    public static function comparisonLabel(string $baseUnit): string
    {
        return match ($baseUnit) {
            'g' => '100 g',
            'ml' => 'L',
            default => 'unidad',
        };
    }

    /** Formatea una cantidad en unidad base usando kg o L cuando es más cómodo. */
    public static function format(?float $quantity, ?string $baseUnit): string
    {
        if ($quantity === null) {
            return '—';
        }

        $number = fn (float $value) => rtrim(rtrim(number_format($value, 3, ',', '.'), '0'), ',');

        return match ($baseUnit) {
            'g' => $quantity >= 1000 ? $number($quantity / 1000).' kg' : $number($quantity).' g',
            'ml' => $quantity >= 1000 ? $number($quantity / 1000).' L' : $number($quantity).' ml',
            'unit' => $number($quantity).' '.($quantity == 1 ? 'unidad' : 'unidades'),
            default => $number($quantity),
        };
    }
}
