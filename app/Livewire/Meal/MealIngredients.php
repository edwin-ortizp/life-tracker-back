<?php

namespace App\Livewire\Meal;

use App\Models\ShoppingItem;
use App\Services\Meal\IngredientImportService;
use Illuminate\Support\Facades\DB;
use Livewire\Attributes\Layout;
use Livewire\Attributes\On;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Ingredientes')]
class MealIngredients extends Component
{
    #[Url(as: 'q', history: true, keep: true)]
    public string $search = '';

    #[Url(as: 'category', history: true, keep: true)]
    public string $categoryFilter = '';

    public bool $showForm = false;
    public ?string $editingId = null;

    // Product form fields
    public string $name = '';
    public int $stock = 0;
    public int $toBuy = 0;
    public string $category = '';
    public ?string $consumeBy = null;
    public string $status = 'available';
    public bool $nextPurchase = false;
    public string $unit = '';

    // Variants (dynamic rows)
    public array $variants = [];

    // Alternative names used by the bulk import assistant
    public array $aliases = [];

    public array $categoryOptions = [
        'frutas_verduras' => 'Frutas y verduras',
        'carnes' => 'Carnes y pescados',
        'lacteos' => 'Lácteos y huevos',
        'panaderia' => 'Panadería',
        'cereales' => 'Cereales y granos',
        'enlatados' => 'Enlatados y conservas',
        'condimentos' => 'Condimentos y salsas',
        'bebidas' => 'Bebidas',
        'congelados' => 'Congelados',
        'snacks' => 'Snacks y dulces',
        'limpieza' => 'Limpieza',
        'higiene' => 'Higiene personal',
        'mascotas' => 'Mascotas',
        'otros' => 'Otros',
    ];

    public function openForm(?string $id = null)
    {
        $this->resetValidation();

        if ($id) {
            $item = ShoppingItem::with(['variants', 'aliases'])->find($id);
            if (!$item) return;

            $this->editingId = $item->id;
            $this->name = $item->name;
            $this->stock = $item->stock ?? 0;
            $this->toBuy = $item->to_buy ?? 0;
            $this->category = $item->category ?? '';
            $this->consumeBy = $item->consume_by?->format('Y-m-d');
            $this->status = $item->status ?? 'available';
            $this->nextPurchase = $item->next_purchase ?? false;
            $this->unit = $item->unit ?? '';
            $this->variants = $item->variants->map(fn($v) => [
                'id' => $v->id,
                'place' => $v->place ?? '',
                'price' => $v->price,
                'barcode' => $v->barcode ?? '',
                'presentation' => $v->presentation ?? '',
                'notes' => $v->notes ?? '',
            ])->toArray();
            $this->aliases = $item->aliases->map(fn ($alias) => [
                'id' => $alias->id,
                'alias' => $alias->alias,
            ])->toArray();
        } else {
            $this->editingId = null;
            $this->name = '';
            $this->stock = 0;
            $this->toBuy = 0;
            $this->category = '';
            $this->consumeBy = null;
            $this->status = 'available';
            $this->nextPurchase = false;
            $this->unit = '';
            $this->variants = [];
            $this->aliases = [];
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
        $this->variants[] = ['id' => null, 'place' => '', 'price' => null, 'barcode' => '', 'presentation' => '', 'notes' => ''];
    }

    public function removeVariant(int $index)
    {
        unset($this->variants[$index]);
        $this->variants = array_values($this->variants);
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
            'stock' => 'required|integer|min:0',
            'toBuy' => 'required|integer|min:0',
            'variants.*.place' => 'nullable|string|max:255',
            'variants.*.price' => 'nullable|numeric|min:0',
            'variants.*.barcode' => 'nullable|string|max:255',
            'variants.*.presentation' => 'nullable|string|max:255',
            'variants.*.notes' => 'nullable|string|max:2000',
            'aliases.*.alias' => 'nullable|string|max:255',
        ]);

        $importer->assertNameAvailable(trim($this->name), $this->editingId);

        $data = [
            'name' => trim($this->name),
            'stock' => $this->stock,
            'to_buy' => $this->toBuy,
            'category' => $this->category ?: null,
            'consume_by' => $this->consumeBy ?: null,
            'status' => $this->status,
            'next_purchase' => $this->nextPurchase,
            'unit' => $this->unit ?: null,
        ];

        DB::transaction(function () use ($data, $importer) {
            if ($this->editingId) {
                $item = ShoppingItem::find($this->editingId);
                if (!$item) return;
                $item->update($data);
            } else {
                $item = ShoppingItem::create($data);
            }

            $keptIds = [];
            foreach ($this->variants as $variant) {
                if (empty($variant['place']) && ($variant['price'] ?? null) === null && empty($variant['presentation']) && empty($variant['barcode']) && empty($variant['notes'])) {
                    continue;
                }

                $variantData = [
                    'place' => trim((string) ($variant['place'] ?? '')) ?: null,
                    'price' => ($variant['price'] ?? null) !== '' ? ($variant['price'] ?? null) : null,
                    'barcode' => trim((string) ($variant['barcode'] ?? '')) ?: null,
                    'presentation' => trim((string) ($variant['presentation'] ?? '')) ?: null,
                    'notes' => trim((string) ($variant['notes'] ?? '')) ?: null,
                ];

                $existingVariant = !empty($variant['id'])
                    ? $item->variants()->whereKey($variant['id'])->first()
                    : null;

                if ($existingVariant) {
                    $existingVariant->update($variantData);
                    $keptIds[] = $existingVariant->id;
                } else {
                    $keptIds[] = $item->variants()->create($variantData)->id;
                }
            }

            $item->variants()->when($keptIds, fn ($query) => $query->whereNotIn('id', $keptIds))->delete();
            $importer->syncAliases($item, $this->aliases);
        });

        $this->closeForm();
    }

    public function toggleNextPurchase(string $id)
    {
        $item = ShoppingItem::find($id);
        if ($item) {
            $item->update(['next_purchase' => !$item->next_purchase]);
        }
    }

    public function delete(string $id)
    {
        ShoppingItem::where('id', $id)->delete();
    }

    #[On('ingredients-imported')]
    public function refreshIngredients(): void
    {
        // The event is enough to trigger a fresh render of the catalog.
    }

    public function render()
    {
        $items = ShoppingItem::query()
            ->with('variants')
            ->withCount('variants')
            ->when($this->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($this->categoryFilter, fn($q, $c) => $q->where('category', $c))
            ->orderBy('name')
            ->get();

        $grouped = $items->groupBy('category')->sortKeys();

        $byCategory = $items->groupBy('category')->map->count()->sortKeys();
        $nextPurchaseCount = $items->where('next_purchase', true)->count();
        $lowStockCount = $items->where('stock', 0)->count();

        return view('livewire.meal.meal-ingredients', [
            'grouped' => $grouped,
            'totalItems' => $items->count(),
            'byCategory' => $byCategory,
            'nextPurchaseCount' => $nextPurchaseCount,
            'lowStockCount' => $lowStockCount,
        ]);
    }
}
