<?php

namespace App\Mcp\Tools\Shopping\Concerns;

use App\Models\ShoppingItem;
use App\Models\ShoppingItemPrice;
use App\Models\ShoppingItemVariant;
use App\Services\Meal\CatalogNames;
use App\Services\Meal\UnitConverter;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Validation\Rule;

/**
 * Parámetros compartidos para registrar variante (marca, empaque, contenido) y precio con tienda, fecha y fuente.
 */
trait RecordsVariantPrices
{
    protected function variantPriceRules(): array
    {
        return [
            'base_unit' => ['nullable', 'string', 'max:20'],
            'brand' => ['nullable', 'string', 'max:255'],
            'packaging' => ['nullable', Rule::in(array_keys(ShoppingItemVariant::PACKAGINGS))],
            'content' => ['nullable', 'numeric', 'gt:0'],
            'content_unit' => ['nullable', 'string', 'max:20'],
            'units_per_pack' => ['nullable', 'integer', 'min:1'],
            'barcode' => ['nullable', 'string', 'max:255'],
            'store' => ['nullable', 'string', 'max:255', 'required_with:price'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'price_date' => ['nullable', 'date'],
            'source' => ['nullable', Rule::in(array_keys(ShoppingItemPrice::SOURCES))],
            'verified' => ['nullable', 'boolean'],
        ];
    }

    /** Acepta g/ml/unit o unidades escritas ("kg", "litros") y devuelve la unidad base, o null. */
    protected function resolveBaseUnit(?string $unit): ?string
    {
        if (blank($unit)) {
            return null;
        }

        return array_key_exists($unit, ShoppingItem::BASE_UNITS) ? $unit : UnitConverter::baseUnitOf($unit);
    }

    /**
     * Crea o reutiliza la variante descrita y registra el precio si viene. Devuelve un texto con lo hecho o null.
     */
    protected function recordVariantPrice(ShoppingItem $item, array $data): ?string
    {
        $describesVariant = collect(['brand', 'packaging', 'content', 'units_per_pack', 'barcode'])->contains(fn ($key) => filled($data[$key] ?? null));
        if (! $describesVariant && blank($data['price'] ?? null)) {
            return null;
        }

        $brand = CatalogNames::brand($data['brand'] ?? null);
        $content = null;
        if (filled($data['content'] ?? null) && $item->base_unit) {
            $content = UnitConverter::toBase((float) $data['content'], $data['content_unit'] ?? null, $item->base_unit, $item->grams_per_piece);
        }

        $variant = $item->variants()
            ->when($describesVariant, fn ($query) => $query
                ->where('brand_id', $brand?->id)
                ->when($content !== null, fn ($q) => $q->where('content', $content), fn ($q) => $q->whereNull('content')))
            ->orderByDesc('is_preferred')
            ->first();

        $attributes = array_filter([
            'brand_id' => $brand?->id,
            'packaging' => $data['packaging'] ?? null,
            'content' => $content,
            'units_per_pack' => $data['units_per_pack'] ?? null,
            'barcode' => $data['barcode'] ?? null,
        ], fn ($value) => $value !== null);

        $variant ? $variant->update($attributes) : $variant = $item->variants()->create($attributes);

        if (blank($data['price'] ?? null)) {
            return 'variante '.$variant->label($item->base_unit);
        }

        $source = $data['source'] ?? 'manual';
        $verified = (bool) ($data['verified'] ?? $source === 'ticket');
        $variant->prices()->create([
            'store_id' => CatalogNames::store($data['store'])->id,
            'amount' => $data['price'],
            'observed_on' => $data['price_date'] ?? now()->toDateString(),
            'source' => $source,
            'verified_at' => $verified ? now() : null,
            'verified_by' => $verified ? auth()->id() : null,
        ]);

        return 'precio $'.number_format((float) $data['price'], 0, ',', '.').' en '.$data['store'].' ('.$variant->label($item->base_unit).')';
    }

    protected function variantPriceSchema(JsonSchema $schema): array
    {
        return [
            'base_unit' => $schema->string()->enum(array_keys(ShoppingItem::BASE_UNITS))
                ->description('Unidad base del producto: g (peso), ml (volumen) o unit (contado). Obligatoria al crear un producto; no cambia después.'),
            'brand' => $schema->string()->description('Marca de la variante (Imatá, Latti...). El nombre del producto no lleva marca.'),
            'packaging' => $schema->string()->enum(array_keys(ShoppingItemVariant::PACKAGINGS))->description('Empaque de la variante.'),
            'content' => $schema->number()->description('Contenido del paquete, por ejemplo 900. Sin contenido la variante no se puede comparar.'),
            'content_unit' => $schema->string()->description('Unidad del contenido (g, kg, libra, ml, L, unidades, docena). Se convierte a la unidad base.'),
            'units_per_pack' => $schema->integer()->description('Unidades por paquete (5 arepas).'),
            'barcode' => $schema->string()->description('Código de barras de la variante.'),
            'store' => $schema->string()->description('Tienda (cadena) del precio. Requerida con "price".'),
            'price' => $schema->number()->description('Precio del paquete en esa tienda.'),
            'price_date' => $schema->string()->description('Fecha del precio (YYYY-MM-DD). Por defecto hoy.'),
            'source' => $schema->string()->enum(array_keys(ShoppingItemPrice::SOURCES))->description('De dónde viene el precio: manual, ticket o web. Por defecto manual.'),
            'verified' => $schema->boolean()->description('Si el precio está verificado en tienda. Un ticket se marca verificado por defecto.'),
        ];
    }
}
