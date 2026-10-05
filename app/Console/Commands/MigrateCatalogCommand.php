<?php

namespace App\Console\Commands;

use App\Models\RecipeIngredient;
use App\Models\ShoppingItem;
use App\Models\ShoppingItemPrice;
use App\Models\ShoppingItemVariant;
use App\Models\User;
use App\Services\Meal\CatalogNames;
use App\Services\Meal\UnitConverter;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * Convierte el catálogo de texto libre (unidad, tienda, presentación, precio y notas) al modelo
 * de productos, variantes, tiendas, marcas y precios con fecha y fuente.
 *
 * 1. --export escribe export.json con los datos actuales.
 * 2. Se prepara mapping.json (revisado por el usuario) con las decisiones que no se pueden inferir.
 * 3. --apply=mapping.json aplica todo en una transacción y escribe report.md con lo no convertido.
 */
class MigrateCatalogCommand extends Command
{
    protected $signature = 'meals:migrate-catalog
        {--user= : Id del usuario dueño del catálogo}
        {--export : Exporta el catálogo actual a JSON}
        {--apply= : Ruta del mapping JSON a aplicar}
        {--dry-run : Aplica dentro de una transacción y la revierte}';

    protected $description = 'Migra el catálogo de compras a productos, variantes y precios comparables';

    private array $report = [];

    public function handle(): int
    {
        $user = User::find($this->option('user'));
        if (! $user) {
            $this->error('Indica un --user válido.');

            return self::FAILURE;
        }
        auth()->setUser($user);

        $dir = storage_path('app/catalog-migration');
        File::ensureDirectoryExists($dir);

        if ($this->option('export')) {
            File::put($dir.'/export.json', json_encode($this->export(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            $this->info("Exportado a {$dir}/export.json");

            return self::SUCCESS;
        }

        $path = $this->option('apply');
        if (! $path || ! File::exists($path)) {
            $this->error('Usa --export o --apply=<ruta del mapping>.');

            return self::FAILURE;
        }

        $mapping = json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);

        DB::beginTransaction();
        try {
            $stats = $this->apply($mapping);
            $this->option('dry-run') ? DB::rollBack() : DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        File::put($dir.'/report.md', $this->renderReport($stats));
        $this->table(['Concepto', 'Cantidad'], collect($stats)->map(fn ($v, $k) => [$k, $v])->values());
        $this->info(($this->option('dry-run') ? '[dry-run] ' : '')."Informe en {$dir}/report.md");

        return self::SUCCESS;
    }

    private function export(): array
    {
        return [
            'products' => ShoppingItem::with('variants')->orderBy('name')->get()->map(fn (ShoppingItem $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'category' => $item->category,
                'unit' => $item->getRawOriginal('unit'),
                'stock' => $item->stock,
                'to_buy' => $item->to_buy,
                'variants' => $item->variants->map(fn (ShoppingItemVariant $variant) => [
                    'id' => $variant->id,
                    'place' => $variant->getRawOriginal('place'),
                    'price' => $variant->getRawOriginal('price'),
                    'presentation' => $variant->getRawOriginal('presentation'),
                    'barcode' => $variant->barcode,
                    'notes' => $variant->getRawOriginal('notes'),
                    'updated_at' => $variant->updated_at?->toDateString(),
                ])->values(),
            ])->values(),
            'recipe_ingredients' => RecipeIngredient::with(['recipe:id,name', 'shoppingItem:id,name'])->get()->map(fn ($ingredient) => [
                'id' => $ingredient->id,
                'recipe' => $ingredient->recipe?->name,
                'product_id' => $ingredient->shopping_item_id,
                'product' => $ingredient->shoppingItem?->name,
                'quantity' => $ingredient->quantity,
                'unit' => $ingredient->unit,
            ])->values(),
        ];
    }

    private function apply(array $mapping): array
    {
        $stats = ['productos' => 0, 'productos nuevos' => 0, 'variantes' => 0, 'variantes nuevas' => 0, 'precios' => 0, 'tiendas' => 0, 'marcas' => 0, 'ingredientes de receta' => 0];
        $storeAliases = collect($mapping['stores'] ?? [])->mapWithKeys(fn ($canonical, $legacy) => [CatalogNames::normalize($legacy) => $canonical]);

        $resolveStore = function (?string $legacy) use ($storeAliases) {
            if (blank($legacy)) {
                return null;
            }

            return CatalogNames::store($storeAliases[CatalogNames::normalize($legacy)] ?? $legacy);
        };

        foreach (ShoppingItem::with('variants')->get() as $item) {
            $productMap = $mapping['products'][$item->id] ?? [];
            $baseUnit = $productMap['base_unit'] ?? UnitConverter::baseUnitOf($item->getRawOriginal('unit'));

            $item->forceFill(array_filter([
                'name' => $productMap['name'] ?? null,
                'base_unit' => $baseUnit,
                'grams_per_piece' => $productMap['grams_per_piece'] ?? null,
                'min_stock' => $productMap['min_stock'] ?? null,
                'kcal' => $productMap['kcal'] ?? null,
                'protein' => $productMap['protein'] ?? null,
                'carbs' => $productMap['carbs'] ?? null,
                'fat' => $productMap['fat'] ?? null,
            ], fn ($value) => $value !== null))->save();
            $stats['productos']++;

            if (! $baseUnit) {
                $this->note('Productos sin unidad base', $item->name, 'La unidad "'.($item->getRawOriginal('unit') ?? '').'" no es g, ml ni unidad; decide a mano.');
            }

            if (filled($productMap['review'] ?? null)) {
                $this->note('Revisar a mano', $item->name, $productMap['review']);
            }

            foreach ($item->variants as $variant) {
                $variantMap = $mapping['variants'][$variant->id] ?? [];
                $owner = $item;

                // Una variante que en realidad es otro producto (p. ej. pechuga y contramuslo) se mueve a uno nuevo.
                if (isset($variantMap['new_product'])) {
                    $new = $variantMap['new_product'];
                    $owner = ShoppingItem::firstOrCreate(['name' => $new['name']], [
                        'base_unit' => $new['base_unit'] ?? $baseUnit,
                        'category' => $new['category'] ?? $item->category,
                        'status' => 'available',
                        'stock' => 0,
                        'to_buy' => 0,
                    ]);
                    $variant->forceFill(['shopping_item_id' => $owner->id])->save();
                    $stats['productos nuevos'] = ($stats['productos nuevos'] ?? 0) + 1;
                }

                $this->migrateVariant($owner, $variant, $variantMap, $resolveStore, $stats);

                // Una variante vieja puede corresponder a varias presentaciones (mismo producto, dos precios en una tienda).
                foreach ($variantMap['split'] ?? [] as $extra) {
                    $new = $item->variants()->create(['barcode' => null]);
                    $this->migrateVariant($item, $new, $extra + ['store' => $variantMap['store'] ?? $variant->getRawOriginal('place')], $resolveStore, $stats, legacy: false);
                    $stats['variantes nuevas']++;
                }
            }
        }

        foreach (RecipeIngredient::with('shoppingItem')->get() as $ingredient) {
            $override = $mapping['recipe_ingredients'][$ingredient->id] ?? null;
            $product = $ingredient->shoppingItem;
            $quantity = $override['quantity'] ?? null;

            // Sin unidad, la cantidad solo es fiable en productos contados: "1 Queso campesino" no son 1 g.
            $unitless = blank($ingredient->unit) && $product?->base_unit !== 'unit';

            if ($quantity === null && ! $unitless && $ingredient->quantity !== null && $product?->base_unit) {
                $quantity = UnitConverter::toBase((float) $ingredient->quantity, $ingredient->unit, $product->base_unit, $product->grams_per_piece);
            }

            if ($quantity === null) {
                $this->note('Ingredientes de receta sin convertir', ($product?->name ?? '?').' en '.($ingredient->recipe?->name ?? '?'), "{$ingredient->quantity} {$ingredient->unit} no se puede expresar en ".($product?->base_unit ?? 'una unidad base').'.');

                continue;
            }

            $ingredient->forceFill(['quantity' => $quantity, 'unit' => $product->base_unit])->save();
            $stats['ingredientes de receta']++;
        }

        $stats['tiendas'] = \App\Models\Store::count();
        $stats['marcas'] = \App\Models\Brand::count();

        return $stats;
    }

    private function migrateVariant(ShoppingItem $item, ShoppingItemVariant $variant, array $map, callable $resolveStore, array &$stats, bool $legacy = true): void
    {
        $notes = $legacy ? (string) $variant->getRawOriginal('notes') : '';
        $presentation = $legacy ? (string) $variant->getRawOriginal('presentation') : '';
        $legacyPrice = $legacy ? $variant->getRawOriginal('price') : null;

        $content = $map['content'] ?? null;
        if ($content === null && $presentation !== '' && $item->base_unit) {
            [$parsed, $unit] = UnitConverter::parse($presentation) ?? [null, null];
            $content = $unit === $item->base_unit ? $parsed : null;
        }

        $brand = isset($map['brand']) ? CatalogNames::brand($map['brand']) : null;
        if ($brand && ($map['is_store_brand'] ?? false)) {
            $brand->update(['is_store_brand' => true]);
        }

        $variant->forceFill([
            'brand_id' => $brand?->id,
            'packaging' => $map['packaging'] ?? null,
            'content' => $content,
            'units_per_pack' => $map['units_per_pack'] ?? null,
            'is_preferred' => $map['is_preferred'] ?? false,
        ])->save();
        $stats['variantes']++;

        $label = $item->name.' · '.($map['store'] ?? $variant->getRawOriginal('place') ?? 'sin tienda').($presentation !== '' ? ' · '.$presentation : '');
        if ($content === null && ($item->base_unit ?? 'unit') !== 'unit') {
            $this->note('Variantes pendientes de completar (sin contenido)', $label, $presentation !== '' ? "No se pudo leer el contenido de \"{$presentation}\"." : 'No tiene presentación.');
        }

        $amount = $map['price'] ?? $legacyPrice;
        if ($amount === null || ($map['skip_price'] ?? false)) {
            return;
        }

        $store = $resolveStore($map['store'] ?? ($legacy ? $variant->getRawOriginal('place') : null));
        if (! $store) {
            $this->note('Precios sin tienda (no migrados)', $label, "Precio {$amount} sin tienda asociada.");

            return;
        }

        $isWeb = Str::contains(Str::lower($notes), ['ref. web', 'web']);
        $variant->prices()->create([
            'store_id' => $store->id,
            'amount' => $amount,
            'observed_on' => $map['observed_on'] ?? ($variant->updated_at ?? Carbon::now())->toDateString(),
            'source' => $map['source'] ?? ($isWeb ? 'web' : 'manual'),
        ]);
        $stats['precios']++;

        if (filled($map['review'] ?? null)) {
            $this->note('Revisar a mano', $label, $map['review']);
        }
    }

    private function note(string $section, string $subject, string $reason): void
    {
        $this->report[$section][] = "- **{$subject}**: {$reason}";
    }

    private function renderReport(array $stats): string
    {
        $lines = ['# Informe de migración del catálogo', '', 'Generado el '.now()->format('Y-m-d H:i').($this->option('dry-run') ? ' (dry-run, sin cambios guardados)' : ''), ''];
        foreach ($stats as $label => $value) {
            $lines[] = "- {$label}: {$value}";
        }

        if ($this->report === []) {
            $lines[] = '';
            $lines[] = 'Todo se convirtió sin pendientes.';
        }

        foreach ($this->report as $section => $items) {
            $lines[] = '';
            $lines[] = "## {$section} (".count($items).')';
            $lines[] = '';
            array_push($lines, ...$items);
        }

        return implode("\n", $lines)."\n";
    }
}
