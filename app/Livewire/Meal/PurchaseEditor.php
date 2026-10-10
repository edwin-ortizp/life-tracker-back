<?php

namespace App\Livewire\Meal;

use App\Models\Purchase;
use App\Models\ShoppingItem;
use App\Models\Store;
use App\Services\Meal\PurchaseRecorder;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Locked;
use Livewire\Attributes\On;
use Livewire\Component;

class PurchaseEditor extends Component
{
    public bool $show = false;

    #[Locked]
    public ?string $purchaseId = null;

    #[Locked]
    public string $operationKey = '';

    public array $form = [];

    #[On('open-purchase-editor')]
    public function open(?string $purchaseId = null): void
    {
        $this->resetValidation();
        $this->purchaseId = $purchaseId;
        $this->operationKey = (string) Str::uuid();
        $this->form = ['purchased_at' => now()->format('Y-m-d\TH:i'), 'store_id' => '', 'total_paid' => '', 'payment_method' => '', 'ticket_reference' => '', 'notes' => '', 'lines' => []];
        if ($purchaseId) {
            $purchase = Purchase::where('user_id', auth()->id())->with('lines')->findOrFail($purchaseId);
            $this->form = $purchase->only(['store_id', 'total_paid', 'payment_method', 'ticket_reference', 'notes']) + [
                'purchased_at' => $purchase->purchased_at->format('Y-m-d\TH:i'),
                'lines' => $purchase->lines->map(fn ($line) => $line->only(['id', 'shopping_item_id', 'shopping_item_variant_id', 'packages', 'unit_price', 'ticket_text']))->all(),
            ];
        } else {
            $this->addLine();
        }
        $this->show = true;
    }

    public function addLine(): void
    {
        if (count($this->form['lines'] ?? []) >= 200) {
            return;
        }
        $this->form['lines'][] = ['_key' => (string) Str::uuid(), 'shopping_item_id' => '', 'shopping_item_variant_id' => '', 'packages' => 1, 'unit_price' => '', 'ticket_text' => ''];
    }

    public function removeLine(int $index): void
    {
        unset($this->form['lines'][$index]);
        $this->form['lines'] = array_values($this->form['lines']);
    }

    public function updatedForm($value, ?string $key = null): void
    {
        if ($key && preg_match('/^lines\.(\d+)\.shopping_item_id$/', $key, $matches)) {
            $this->form['lines'][(int) $matches[1]]['shopping_item_variant_id'] = '';
        }
    }

    public function close(): void
    {
        $this->show = false;
    }

    public function save(): void
    {
        // Convert empty optional form controls to null before service validation.
        $normalize = function (array $values) use (&$normalize): array {
            return array_map(fn ($value) => is_array($value) ? $normalize($value) : ($value === '' ? null : $value), $values);
        };
        try {
            $purchase = app(PurchaseRecorder::class)->save($normalize($this->form) + ['operation_key' => $this->operationKey], $this->purchaseId);
        } catch (ValidationException $exception) {
            foreach ($exception->errors() as $field => $messages) {
                $this->addError('form.'.$field, $messages[0]);
            }

            return;
        }
        $this->show = false;
        $this->dispatch('purchase-saved', purchaseId: $purchase->id);
    }

    public function render()
    {
        return view('livewire.meal.purchase-editor', [
            'products' => $this->show ? ShoppingItem::where('user_id', auth()->id())->with('variants.brand')->orderBy('name')->get() : collect(),
            'stores' => $this->show ? Store::where('user_id', auth()->id())->orderBy('name')->pluck('name', 'id') : collect(),
        ]);
    }
}
