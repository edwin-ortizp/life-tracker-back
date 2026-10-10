<?php

namespace App\Livewire\Meal;

use App\Livewire\Concerns\WithManagementCard;
use App\Models\Brand;
use App\Models\PurchaseLine;
use App\Models\ShoppingItem;
use App\Models\ShoppingItemPrice;
use App\Models\ShoppingItemVariant;
use App\Models\Store;
use App\Services\Meal\CatalogNames;
use App\Services\Meal\IngredientImportService;
use App\Services\Meal\RecipeCalculator;
use App\Services\Meal\UnitConverter;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Layout;
use Livewire\Attributes\On;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Ingredientes')]
class MealIngredients extends Component
{
    use WithManagementCard;

    /** Unidades de captura aceptadas por unidad base; se convierten al guardar. */
    public const CONTENT_UNITS = [
        'g' => ['g' => 'g', 'kg' => 'kg', 'lb' => 'libra'],
        'ml' => ['ml' => 'ml', 'l' => 'L'],
        'unit' => ['unit' => 'und', 'docena' => 'docena', 'carton' => 'cartón (30)'],
    ];

    #[Url(as: 'q', history: true, keep: true)]
    public string $search = '';

    #[Url(as: 'category', history: true, keep: true)]
    public string $categoryFilter = '';

    // '' todas, '__none' sin ningún precio, o el id de la tienda.
    #[Url(as: 'store', history: true, keep: true)]
    public string $storeFilter = '';

    // '' todos, 'with' con precio, 'without' sin precio.
    #[Url(as: 'price', history: true, keep: true)]
    public string $priceFilter = '';

    // '' todos, 'yes' en lista de compras, 'no' fuera de la lista.
    #[Url(as: 'cart', history: true, keep: true)]
    public string $cartFilter = '';

    // '' todos, 'pending' sin unidad base o con variantes sin contenido.
    #[Url(as: 'data', history: true, keep: true)]
    public string $dataFilter = '';

    public bool $showForm = false;

    public ?string $editingId = null;

    // Product form fields
    public string $name = '';

    public string $baseUnit = '';

    public bool $baseUnitLocked = false;

    public $gramsPerPiece = null;

    public $stock = 0;

    public $minStock = null;

    public $toBuy = 0;

    public string $category = '';

    public ?string $consumeBy = null;

    public string $status = 'available';

    public bool $nextPurchase = false;

    public $kcal = null;

    public $protein = null;

    public $carbs = null;

    public $fat = null;

    // Variants (dynamic rows), each with its own prices.
    public array $variants = [];

    // Alternative names used by the bulk import assistant
    public array $aliases = [];

    public array $categoryOptions = ShoppingItem::CATEGORIES;

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function updatedCategoryFilter(): void
    {
        $this->resetPage();
    }

    public function updatedStoreFilter(): void
    {
        $this->resetPage();
    }

    public function updatedPriceFilter(): void
    {
        $this->resetPage();
    }

    public function updatedCartFilter(): void
    {
        $this->resetPage();
    }

    public function updatedDataFilter(): void
    {
        $this->resetPage();
    }

    public function clearFilters(): void
    {
        $this->reset(['categoryFilter', 'storeFilter', 'priceFilter', 'cartFilter', 'dataFilter']);
        $this->resetPage();
    }

    public function updatedBaseUnit(): void
    {
        foreach ($this->variants as $index => $variant) {
            $this->variants[$index]['content_unit'] = $this->defaultContentUnit();
        }
    }

    public function openForm(?string $id = null)
    {
        $this->resetValidation();

        if ($id) {
            $item = ShoppingItem::with(['variants.brand', 'variants.prices.store', 'aliases'])->find($id);
            if (! $item) {
                return;
            }

            $this->editingId = $item->id;
            $this->name = $item->name;
            $this->baseUnit = $item->base_unit ?? '';
            $this->baseUnitLocked = $item->base_unit !== null;
            $this->gramsPerPiece = $item->grams_per_piece;
            $this->stock = $item->stock ?? 0;
            $this->minStock = $item->min_stock;
            $this->toBuy = $item->to_buy ?? 0;
            $this->category = $item->category ?? '';
            $this->consumeBy = $item->consume_by?->format('Y-m-d');
            $this->status = $item->status ?? 'available';
            $this->nextPurchase = $item->next_purchase ?? false;
            $this->kcal = $item->kcal;
            $this->protein = $item->protein;
            $this->carbs = $item->carbs;
            $this->fat = $item->fat;
            $this->variants = $item->variants->map(fn (ShoppingItemVariant $v) => [
                'id' => $v->id,
                'brand' => $v->brand?->name ?? '',
                'packaging' => $v->packaging ?? '',
                'content' => $v->content,
                'content_unit' => $this->defaultContentUnit(),
                'units_per_pack' => $v->units_per_pack,
                'barcode' => $v->barcode ?? '',
                'is_preferred' => $v->is_preferred,
                'kcal' => $v->kcal,
                'prices' => $v->prices->sortByDesc('observed_on')->map(fn (ShoppingItemPrice $p) => [
                    'id' => $p->id,
                    'purchase_line_id' => $p->purchase_line_id,
                    'store_id' => $p->store_id,
                    'amount' => $p->amount,
                    'observed_on' => $p->observed_on->format('Y-m-d'),
                    'source' => $p->source,
                    'verified' => $p->isVerified(),
                ])->values()->toArray(),
            ])->toArray();
            $this->aliases = $item->aliases->map(fn ($alias) => [
                'id' => $alias->id,
                'alias' => $alias->alias,
            ])->toArray();
        } else {
            $this->reset(['editingId', 'name', 'baseUnit', 'baseUnitLocked', 'gramsPerPiece', 'stock', 'minStock', 'toBuy', 'category', 'consumeBy', 'status', 'nextPurchase', 'kcal', 'protein', 'carbs', 'fat', 'variants', 'aliases']);
        }

        $this->showForm = true;
    }

    public function closeForm()
    {
        $this->showForm = false;
        $this->editingId = null;
    }

    public function addVariant()
    {
        $this->variants[] = [
            'id' => null, 'brand' => '', 'packaging' => '', 'content' => null, 'content_unit' => $this->defaultContentUnit(),
            'units_per_pack' => null, 'barcode' => '', 'is_preferred' => false, 'kcal' => null, 'prices' => [],
        ];
    }

    public function removeVariant(int $index)
    {
        unset($this->variants[$index]);
        $this->variants = array_values($this->variants);
    }

    public function addPrice(int $variantIndex): void
    {
        $this->variants[$variantIndex]['prices'][] = [
            'id' => null, 'store_id' => '', 'amount' => null, 'observed_on' => now()->toDateString(), 'source' => 'manual', 'verified' => false,
        ];
    }

    public function removePrice(int $variantIndex, int $priceIndex): void
    {
        unset($this->variants[$variantIndex]['prices'][$priceIndex]);
        $this->variants[$variantIndex]['prices'] = array_values($this->variants[$variantIndex]['prices']);
    }

    public function addAlias(): void
    {
        $this->aliases[] = ['id' => null, 'alias' => ''];
    }

    public function removeAlias(int $index): void
    {
        unset($this->aliases[$index]);
        $this->aliases = array_values($this->aliases);
    }

    public function save(IngredientImportService $importer)
    {
        $this->validate([
            'name' => 'required|string|max:255',
            'baseUnit' => ['required', Rule::in(array_keys(ShoppingItem::BASE_UNITS))],
            'gramsPerPiece' => 'nullable|numeric|gt:0',
            'stock' => 'required|numeric|min:0',
            'minStock' => 'nullable|numeric|min:0',
            'toBuy' => 'required|numeric|min:0',
            'kcal' => 'nullable|numeric|min:0',
            'protein' => 'nullable|numeric|min:0',
            'carbs' => 'nullable|numeric|min:0',
            'fat' => 'nullable|numeric|min:0',
            'variants.*.brand' => 'nullable|string|max:255',
            'variants.*.packaging' => ['nullable', Rule::in(array_keys(ShoppingItemVariant::PACKAGINGS))],
            'variants.*.content' => 'nullable|numeric|gt:0',
            'variants.*.units_per_pack' => 'nullable|integer|min:1',
            'variants.*.barcode' => 'nullable|string|max:255',
            'variants.*.kcal' => 'nullable|numeric|min:0',
            'variants.*.prices.*.store_id' => ['required', Rule::in(Store::pluck('id'))],
            'variants.*.prices.*.amount' => 'required|numeric|min:0',
            'variants.*.prices.*.observed_on' => 'required|date',
            'variants.*.prices.*.source' => ['required', Rule::in(array_keys(ShoppingItemPrice::SOURCES))],
            'aliases.*.alias' => 'nullable|string|max:255',
        ], attributes: [
            'baseUnit' => 'unidad base',
            'variants.*.prices.*.store_id' => 'tienda',
            'variants.*.prices.*.amount' => 'precio',
            'variants.*.prices.*.observed_on' => 'fecha del precio',
        ]);

        $importer->assertNameAvailable(trim($this->name), $this->editingId);

        $nullable = fn ($value) => $value === '' || $value === null ? null : $value;
        $data = [
            'name' => trim($this->name),
            'grams_per_piece' => $this->baseUnit === 'g' ? $nullable($this->gramsPerPiece) : null,
            'stock' => $this->stock,
            'min_stock' => $nullable($this->minStock),
            'to_buy' => $this->toBuy,
            'category' => $this->category ?: null,
            'consume_by' => $this->consumeBy ?: null,
            'status' => $this->status,
            'next_purchase' => $this->nextPurchase,
            'kcal' => $nullable($this->kcal),
            'protein' => $nullable($this->protein),
            'carbs' => $nullable($this->carbs),
            'fat' => $nullable($this->fat),
        ];

        $item = DB::transaction(function () use ($data, $importer, $nullable) {
            if ($this->editingId) {
                $item = ShoppingItem::find($this->editingId);
                if (! $item) {
                    return null;
                }
                // Un producto no cambia de unidad base una vez definida.
                $item->update($data + ($item->base_unit ? [] : ['base_unit' => $this->baseUnit]));
            } else {
                $item = ShoppingItem::create($data + ['base_unit' => $this->baseUnit]);
            }

            $keptIds = [];
            $preferredSeen = false;
            foreach ($this->variants as $variant) {
                $content = $nullable($variant['content'] ?? null);
                if ($content !== null) {
                    $content = UnitConverter::toBase((float) $content, $variant['content_unit'] ?? null, $item->base_unit) ?? (float) $content;
                }

                $isPreferred = ! $preferredSeen && (bool) ($variant['is_preferred'] ?? false);
                $preferredSeen = $preferredSeen || $isPreferred;

                $variantData = [
                    'brand_id' => CatalogNames::brand($variant['brand'] ?? null)?->id,
                    'packaging' => $variant['packaging'] ?: null,
                    'content' => $content,
                    'units_per_pack' => $nullable($variant['units_per_pack'] ?? null),
                    'barcode' => trim((string) ($variant['barcode'] ?? '')) ?: null,
                    'is_preferred' => $isPreferred,
                    'kcal' => $nullable($variant['kcal'] ?? null),
                ];

                $model = ! empty($variant['id']) ? $item->variants()->whereKey($variant['id'])->first() : null;
                $model ? $model->update($variantData) : $model = $item->variants()->create($variantData);
                $keptIds[] = $model->id;

                $keptPriceIds = [];
                foreach ($variant['prices'] ?? [] as $price) {
                    $priceData = [
                        'store_id' => $price['store_id'],
                        'amount' => $price['amount'],
                        'observed_on' => $price['observed_on'],
                        'source' => $price['source'],
                    ];

                    $priceModel = ! empty($price['id']) ? $model->prices()->whereKey($price['id'])->first() : null;
                    if ($priceModel?->purchase_line_id) {
                        $keptPriceIds[] = $priceModel->id;

                        continue; // Ticket prices are edited through their purchase.
                    }
                    $priceModel ? $priceModel->fill($priceData) : $priceModel = $model->prices()->make($priceData);

                    if (($price['verified'] ?? false) && ! $priceModel->verified_at) {
                        $priceModel->fill(['verified_at' => now(), 'verified_by' => auth()->id()]);
                    } elseif (! ($price['verified'] ?? false)) {
                        $priceModel->fill(['verified_at' => null, 'verified_by' => null]);
                    }

                    $priceModel->save();
                    $keptPriceIds[] = $priceModel->id;
                }
                $model->prices()->whereNull('purchase_line_id')->whereNotIn('id', $keptPriceIds)->delete();
            }

            if (PurchaseLine::where('shopping_item_id', $item->id)->whereNotIn('shopping_item_variant_id', $keptIds)->exists()) {
                throw ValidationException::withMessages(['variants' => 'No puedes eliminar una presentación con compras registradas.']);
            }
            $item->variants()->whereNotIn('id', $keptIds)->delete();
            $importer->syncAliases($item, $this->aliases);

            return $item;
        });

        // Las recetas que usan este producto recalculan su nutrición con los datos nuevos.
        if ($item) {
            app(RecipeCalculator::class)->refreshRecipesUsing($item);
        }

        $this->closeForm();
    }

    public function toggleNextPurchase(string $id)
    {
        $item = ShoppingItem::find($id);
        if ($item) {
            $item->update(['next_purchase' => ! $item->next_purchase]);
        }
    }

    public function delete(string $id)
    {
        if (\App\Models\MealInventoryMovement::where('user_id', auth()->id())->where('shopping_item_id', $id)->exists()) {
            $this->addError('name', 'Este producto tiene movimientos de consumo o preparación y debe conservarse para su historial.');
            return;
        }
        if (PurchaseLine::where('shopping_item_id', $id)->exists()) {
            $this->addError('name', 'Este producto tiene compras registradas y no puede eliminarse.');

            return;
        }
        ShoppingItem::where('id', $id)->delete();
    }

    #[On('ingredients-imported')]
    #[On('stores-updated')]
    public function refreshIngredients(): void
    {
        // The event is enough to trigger a fresh render of the catalog.
    }

    private function defaultContentUnit(): string
    {
        return array_key_first(self::CONTENT_UNITS[$this->baseUnit] ?? ['' => '']);
    }

    public function render()
    {
        $base = ShoppingItem::query()
            ->when($this->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($this->categoryFilter, fn ($q, $c) => $q->where('category', $c))
            ->when($this->storeFilter === '__none', fn ($q) => $q->whereDoesntHave('prices'))
            ->when($this->storeFilter !== '' && $this->storeFilter !== '__none', fn ($q) => $q->whereHas('prices', fn ($pq) => $pq->where('store_id', $this->storeFilter)))
            ->when($this->priceFilter === 'with', fn ($q) => $q->whereHas('prices'))
            ->when($this->priceFilter === 'without', fn ($q) => $q->whereDoesntHave('prices'))
            ->when($this->cartFilter === 'yes', fn ($q) => $q->where('next_purchase', true))
            ->when($this->cartFilter === 'no', fn ($q) => $q->where('next_purchase', false))
            ->when($this->dataFilter === 'pending', fn ($q) => $q->where(fn ($pending) => $pending
                ->whereNull('base_unit')
                ->orWhereHas('variants', fn ($vq) => $vq->whereNull('content'))));

        // La página se agrupa por categoría; los totales del resumen siguen calculándose sobre todo el resultado.
        $ingredients = (clone $base)->withOffers()
            ->orderBy('category')->orderBy('name')
            ->paginate($this->perPage());
        $grouped = $ingredients->getCollection()->groupBy('category')->sortKeys();
        $items = (clone $base)->get(['id', 'category', 'next_purchase', 'stock', 'min_stock']);

        $byCategory = $items->groupBy('category')->map->count()->sortKeys();
        $nextPurchaseCount = $items->where('next_purchase', true)->count();
        $lowStockCount = $items->filter(fn ($item) => (float) $item->stock <= 0 || $item->isBelowMinimum())->count();

        $nameSuggestions = ! $this->editingId && $this->showForm && trim($this->name) !== ''
            ? CatalogNames::similar($this->name, ShoppingItem::pluck('name'))
            : collect();

        return view('livewire.meal.meal-ingredients', [
            'purchaseHistory' => $this->showForm && $this->editingId ? ShoppingItem::where('user_id', auth()->id())->with('purchaseLines.purchase.store')->findOrFail($this->editingId)->purchaseHistorySummary() : null,
            'grouped' => $grouped,
            'ingredients' => $ingredients,
            'catalogTotal' => ShoppingItem::query()->count(),
            'totalItems' => $items->count(),
            'byCategory' => $byCategory,
            'nextPurchaseCount' => $nextPurchaseCount,
            'lowStockCount' => $lowStockCount,
            'stores' => Store::orderBy('name')->pluck('name', 'id'),
            'brands' => $this->showForm ? Brand::orderBy('name')->pluck('name') : collect(),
            'nameSuggestions' => $nameSuggestions,
            'activeFilters' => collect([$this->categoryFilter, $this->storeFilter, $this->priceFilter, $this->cartFilter, $this->dataFilter])->filter()->count(),
        ]);
    }
}
