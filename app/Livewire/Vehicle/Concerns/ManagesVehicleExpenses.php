<?php

namespace App\Livewire\Vehicle\Concerns;

use App\Models\VehicleExpense;
use App\Models\VehicleExpenseCategory;
use Illuminate\Validation\Rule;

/**
 * Otros gastos del vehículo (seguros, llantas, pintura…). La lectura del contador es informativa:
 * no participa en la línea de uso ni recalcula el contador actual.
 */
trait ManagesVehicleExpenses
{
    public bool $showExpenseForm = false;

    public ?string $editingExpenseId = null;

    public string $expenseCategoryId = '';

    public string $expenseDate = '';

    public ?float $expenseAmount = null;

    public string $expenseDescription = '';

    public ?float $expenseUsageReading = null;

    public string $expenseProvider = '';

    public string $expenseMessage = '';

    public function openExpenseForm(?string $id = null): void
    {
        $this->resetExpenseForm();
        $this->resetValidation();

        if ($id) {
            $expense = $this->vehicle()->expenses()->find($id);
            if (! $expense) {
                return;
            }
            $this->editingExpenseId = $expense->id;
            $this->expenseCategoryId = $expense->vehicle_expense_category_id;
            $this->expenseDate = $expense->spent_on->toDateString();
            $this->expenseAmount = (float) $expense->amount;
            $this->expenseDescription = $expense->description ?? '';
            $this->expenseUsageReading = $expense->usage_reading === null ? null : (float) $expense->usage_reading;
            $this->expenseProvider = $expense->provider ?? '';
        } else {
            $this->expenseDate = today()->toDateString();
            $this->expenseCategoryId = (string) VehicleExpenseCategory::query()->orderBy('sort_order')->orderBy('name')->value('id');
        }

        $this->showExpenseForm = true;
    }

    public function closeExpenseForm(): void
    {
        $this->showExpenseForm = false;
        $this->resetExpenseForm();
        $this->resetValidation();
    }

    public function saveExpense(): void
    {
        $vehicle = $this->vehicle();
        $expense = $this->editingExpenseId ? $vehicle->expenses()->find($this->editingExpenseId) : null;
        if ($this->editingExpenseId && ! $expense) {
            $this->closeExpenseForm();

            return;
        }

        $data = $this->validate([
            'expenseCategoryId' => ['required', Rule::exists('vehicle_expense_categories', 'id')->where('user_id', auth()->id())],
            'expenseDate' => ['required', 'date'],
            'expenseAmount' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'expenseDescription' => ['nullable', 'string', 'max:255'],
            'expenseUsageReading' => ['nullable', 'numeric', 'min:0'],
            'expenseProvider' => ['nullable', 'string', 'max:120'],
        ], [
            'expenseCategoryId.required' => 'Elige la categoría del gasto.',
            'expenseCategoryId.exists' => 'Esa categoría no está en tu catálogo.',
        ], [
            'expenseDate' => 'fecha', 'expenseAmount' => 'valor', 'expenseDescription' => 'descripción',
            'expenseUsageReading' => 'lectura', 'expenseProvider' => 'proveedor',
        ]);

        $attributes = [
            'vehicle_id' => $vehicle->id, 'vehicle_expense_category_id' => $data['expenseCategoryId'], 'spent_on' => $data['expenseDate'],
            'amount' => $data['expenseAmount'], 'description' => trim($data['expenseDescription'] ?? '') ?: null,
            'usage_reading' => $data['expenseUsageReading'], 'provider' => trim($data['expenseProvider'] ?? '') ?: null,
        ];
        $expense ? $expense->update($attributes) : VehicleExpense::create($attributes);

        $this->expenseMessage = $expense ? 'Gasto actualizado.' : 'Gasto registrado.';
        $this->closeExpenseForm();
        $this->resetPage();
    }

    public function deleteExpense(string $id): void
    {
        $expense = $this->vehicle()->expenses()->find($id);
        if (! $expense) {
            return;
        }
        $expense->delete();
        $this->expenseMessage = 'Gasto eliminado.';
        $this->resetPage();
    }

    private function resetExpenseForm(): void
    {
        $this->reset('editingExpenseId', 'expenseCategoryId', 'expenseDate', 'expenseAmount', 'expenseDescription', 'expenseUsageReading', 'expenseProvider');
    }
}
