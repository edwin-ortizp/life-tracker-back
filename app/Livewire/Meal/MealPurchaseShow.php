<?php

namespace App\Livewire\Meal;

use App\Models\Purchase;
use App\Models\ShoppingItem;
use Illuminate\Support\Arr;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Locked;
use Livewire\Attributes\On;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Detalle de compra')]
class MealPurchaseShow extends Component
{
    #[Locked]
    public string $purchaseId;

    #[Url]
    public array $history = [];

    public function mount(string $purchase): void
    {
        $this->purchaseId = $purchase;
        Purchase::where('user_id', auth()->id())->findOrFail($purchase);
    }

    #[On('purchase-saved')]
    public function refreshPurchase(): void
    {
        // Render reads the saved historical values again.
    }

    public function render()
    {
        $purchase = Purchase::where('user_id', auth()->id())->with('store', 'lines')->findOrFail($this->purchaseId);
        $history = array_filter(Arr::only($this->history, ['q', 'from', 'to', 'storeId', 'itemId', 'page', 'per_page']), fn ($value) => is_scalar($value));

        return view('livewire.meal.meal-purchase-show', [
            'purchase' => $purchase,
            'summary' => $purchase->summary(),
            'ingredientIds' => ShoppingItem::where('user_id', auth()->id())->whereIn('id', $purchase->lines->pluck('shopping_item_id'))->pluck('id')->all(),
            'backUrl' => route('meals.purchases', $history),
            'detailTabs' => [['label' => 'Historial de compras', 'route' => 'meals.purchases', 'params' => $history, 'icon' => 'bi-receipt', 'active' => ['meals.purchases.show']]],
        ]);
    }
}
