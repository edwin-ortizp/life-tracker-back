<?php

namespace App\Livewire\Meal;

use App\Livewire\Concerns\WithManagementCard;
use App\Models\Purchase;
use App\Models\ShoppingItem;
use App\Models\Store;
use Livewire\Attributes\Layout;
use Livewire\Attributes\On;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Historial de compras')]
class MealPurchases extends Component
{
    use WithManagementCard;

    #[Url]
    public string $from = '';

    #[Url]
    public string $to = '';

    #[Url]
    public string $storeId = '';

    #[Url]
    public string $itemId = '';

    public ?string $detailId = null;

    public bool $showDetail = false;

    public function updated($property): void
    {
        if (in_array($property, ['from', 'to', 'storeId', 'itemId'])) {
            $this->resetPage();
        }
    }

    #[On('purchase-saved')]
    public function refreshPurchases(): void
    {
        $this->resetPage();
    }

    public function openDetail(string $id): void
    {
        $this->detailId = $id;
        $this->showDetail = true;
    }

    public function closeDetail(): void
    {
        $this->showDetail = false;
        $this->detailId = null;
    }

    public function render()
    {
        $query = Purchase::where('user_id', auth()->id())->with('store', 'lines');
        if ($this->from) {
            $query->whereDate('purchased_at', '>=', $this->from);
        }
        if ($this->to) {
            $query->whereDate('purchased_at', '<=', $this->to);
        }
        if ($this->storeId) {
            $query->where('store_id', $this->storeId);
        }
        if ($this->itemId) {
            $query->whereHas('lines', fn ($q) => $q->where('shopping_item_id', $this->itemId));
        }

        return view('livewire.meal.meal-purchases', [
            'purchases' => $query->orderByDesc('purchased_at')->orderByDesc('id')->paginate($this->perPage()),
            'stores' => Store::where('user_id', auth()->id())->orderBy('name')->pluck('name', 'id'),
            'products' => ShoppingItem::where('user_id', auth()->id())->orderBy('name')->pluck('name', 'id'),
            'detail' => $this->detailId ? Purchase::where('user_id', auth()->id())->with('store', 'lines')->findOrFail($this->detailId) : null,
        ]);
    }
}
