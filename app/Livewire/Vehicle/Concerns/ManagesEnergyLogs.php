<?php

namespace App\Livewire\Vehicle\Concerns;

use App\Models\VehicleEnergyLog;
use App\Support\VehicleUsageTimeline;
use Illuminate\Validation\Rule;

trait ManagesEnergyLogs
{
    public bool $showEnergyForm = false;

    public ?string $editingEnergyLogId = null;

    public string $energyDate = '';

    public string $energySource = '';

    public ?float $energyQuantity = null;

    public string $energyUnit = 'L';

    public bool $energyIsFull = false;

    public ?float $energyCost = null;

    public ?float $energyUnitPrice = null;

    public ?string $energyCalculatedField = null;

    public array $energyInputOrder = [];

    public ?float $energyUsageReading = null;

    public string $energyProvider = '';

    public string $energyNotes = '';

    public function openEnergyForm(?string $id = null): void
    {
        $vehicle = $this->vehicle();
        $this->resetEnergyForm();
        if ($id) {
            $log = $vehicle->energyLogs()->find($id);
            if (! $log) {
                return;
            }
            $this->editingEnergyLogId = $log->id;
            $this->energyDate = $log->recorded_on->toDateString();
            $this->energySource = $log->energy_source;
            $this->energyQuantity = (float) $log->quantity;
            $this->energyUnit = $log->unit;
            $this->energyIsFull = (bool) $log->is_full;
            $this->energyCost = $log->cost === null ? null : (float) $log->cost;
            $this->energyUnitPrice = $this->energyCost !== null && $this->energyQuantity > 0 ? round($this->energyCost / $this->energyQuantity, 2) : null;
            $this->energyUsageReading = $log->usage_reading === null ? null : (float) $log->usage_reading;
            $this->energyProvider = $log->provider ?? '';
            $this->energyNotes = $log->notes ?? '';
            $this->energyInputOrder = ['quantity', 'cost'];
            $this->energyCalculatedField = $this->energyUnitPrice === null ? null : 'unit_price';
            $this->showEnergyForm = true;

            return;
        }

        $this->energyDate = today()->toDateString();
        $this->energySource = $this->energySources($vehicle)[0] ?? '';
        $this->energyUnit = $this->energyUnitFor($vehicle, $this->energySource);
        $this->energyUsageReading = $vehicle->current_usage === null ? null : (float) $vehicle->current_usage;
        $this->showEnergyForm = true;
    }

    public function updatedEnergySource(): void
    {
        $vehicle = $this->vehicle();
        $newUnit = $this->energyUnitFor($vehicle, $this->energySource);
        if ($this->editingEnergyLogId && $this->energyUnit !== $newUnit) {
            $this->energyQuantity = $this->energyCost = $this->energyUnitPrice = null;
            $this->energyCalculatedField = null;
            $this->energyInputOrder = [];
        }
        $this->energyUnit = $newUnit;
    }

    public function updatedEnergyQuantity(): void
    {
        $this->syncEnergyPricing('quantity');
    }

    public function updatedEnergyUnitPrice(): void
    {
        $this->syncEnergyPricing('unit_price');
    }

    public function updatedEnergyCost(): void
    {
        $this->syncEnergyPricing('cost');
    }

    public function saveEnergyLog(): void
    {
        $vehicle = $this->vehicle();
        $log = $this->editingEnergyLogId ? $vehicle->energyLogs()->find($this->editingEnergyLogId) : null;
        if ($this->editingEnergyLogId && ! $log) {
            return;
        }
        $expectedUnit = $this->energyUnitFor($vehicle, $this->energySource);
        $allowedUnits = [$expectedUnit];
        if ($log && $log->energy_source === $this->energySource) {
            $allowedUnits[] = $log->unit;
        }
        $data = $this->validate([
            'energyDate' => ['required', 'date'], 'energySource' => ['required', Rule::in($this->energySources($vehicle))],
            'energyQuantity' => ['nullable', 'numeric', 'gt:0'], 'energyUnit' => ['required', Rule::in(array_unique($allowedUnits))],
            'energyIsFull' => ['boolean'], 'energyCost' => ['nullable', 'numeric', 'min:0'],
            'energyUnitPrice' => ['nullable', 'numeric', 'min:0'], 'energyUsageReading' => ['nullable', 'numeric', 'min:0'],
            'energyProvider' => ['nullable', 'string', 'max:120'], 'energyNotes' => ['nullable', 'string', 'max:1000'],
        ]);
        if (! $this->completeEnergyPricing()) {
            return;
        }

        if ($data['energyUsageReading'] !== null) {
            $conflict = VehicleUsageTimeline::conflict($vehicle, $data['energyDate'], (float) $data['energyUsageReading'], 'energy', $log?->id, $log?->created_at);
            if ($conflict) {
                $this->addError('energyUsageReading', $conflict);

                return;
            }
        }

        $attributes = [
            'vehicle_id' => $vehicle->id, 'recorded_on' => $data['energyDate'], 'energy_source' => $data['energySource'],
            'quantity' => $this->energyQuantity, 'unit' => $data['energyUnit'], 'is_full' => $data['energyIsFull'], 'cost' => $this->energyCost,
            'usage_reading' => $data['energyUsageReading'], 'provider' => $data['energyProvider'] ?: null, 'notes' => $data['energyNotes'] ?: null,
        ];
        $log ? $log->update($attributes) : VehicleEnergyLog::create($attributes);
        VehicleUsageTimeline::recalculateCurrentUsage($vehicle);
        $this->showEnergyForm = false;
        $this->resetEnergyForm();
        $this->resetPage();
    }

    public function deleteEnergyLog(string $id): void
    {
        $vehicle = $this->vehicle();
        $log = $vehicle->energyLogs()->find($id);
        if (! $log) {
            return;
        }
        $log->delete();
        VehicleUsageTimeline::recalculateCurrentUsage($vehicle);
        $this->resetPage();
    }

    private function syncEnergyPricing(string $changed): void
    {
        if ($this->energyCalculatedField === $changed) {
            $this->energyCalculatedField = null;
        }
        $this->energyInputOrder = array_values(array_filter($this->energyInputOrder, fn (string $field) => $field !== $changed));
        $this->energyInputOrder[] = $changed;
        $this->calculateEnergyPricing(false);
    }

    private function completeEnergyPricing(): bool
    {
        $this->resetErrorBag(['energyQuantity', 'energyUnitPrice', 'energyCost']);
        if (! $this->calculateEnergyPricing(true)) {
            return false;
        }
        if ($this->energyQuantity === null || $this->energyQuantity <= 0) {
            $this->addError('energyQuantity', 'La cantidad calculada debe ser mayor que cero.');

            return false;
        }

        return true;
    }

    private function calculateEnergyPricing(bool $reportErrors): bool
    {
        $values = ['quantity' => $this->energyQuantity, 'unit_price' => $this->energyUnitPrice, 'cost' => $this->energyCost];
        foreach (array_keys($values) as $field) {
            if ($values[$field] !== null && $field !== $this->energyCalculatedField && ! in_array($field, $this->energyInputOrder, true)) {
                $this->energyInputOrder[] = $field;
            }
        }
        $available = array_keys(array_filter($values, fn ($value) => $value !== null));
        if (count($available) < 2) {
            $this->energyCalculatedField = null;
            if ($reportErrors) {
                $this->addError('energyQuantity', 'Completa dos valores entre cantidad, precio unitario y costo total.');
            }

            return false;
        }
        $orderedAvailable = array_values(array_unique(array_filter($this->energyInputOrder, fn (string $field) => in_array($field, $available, true))));
        if (count($orderedAvailable) < 2) {
            foreach ($available as $field) {
                if (! in_array($field, $orderedAvailable, true)) {
                    $orderedAvailable[] = $field;
                }
            }
        }
        $inputs = array_slice($orderedAvailable, -2);
        if (count($inputs) < 2) {
            if ($reportErrors) {
                $this->addError('energyQuantity', 'Completa dos valores entre cantidad, precio unitario y costo total.');
            }

            return false;
        }
        $target = collect(['quantity', 'unit_price', 'cost'])->first(fn (string $field) => ! in_array($field, $inputs, true));
        if (! $target) {
            return true;
        }
        $pair = collect($inputs)->sort()->values()->all();
        if ($pair === ['quantity', 'unit_price']) {
            $this->energyCost = round((float) $this->energyQuantity * (float) $this->energyUnitPrice, 2);
        } elseif ($pair === ['cost', 'quantity']) {
            if ((float) $this->energyQuantity <= 0) {
                return $this->pricingDivisionError($reportErrors, 'energyQuantity', 'La cantidad debe ser mayor que cero.');
            }
            $this->energyUnitPrice = round((float) $this->energyCost / (float) $this->energyQuantity, 2);
        } else {
            if ((float) $this->energyUnitPrice <= 0) {
                return $this->pricingDivisionError($reportErrors, 'energyUnitPrice', 'El precio unitario debe ser mayor que cero para calcular la cantidad.');
            }
            $this->energyQuantity = round((float) $this->energyCost / (float) $this->energyUnitPrice, 2);
        }
        $this->energyCalculatedField = $target;

        return true;
    }

    private function pricingDivisionError(bool $reportErrors, string $field, string $message): bool
    {
        if ($reportErrors) {
            $this->addError($field, $message);
        }

        return false;
    }

    private function resetEnergyForm(): void
    {
        $this->reset('editingEnergyLogId', 'energyQuantity', 'energyCost', 'energyUnitPrice', 'energyCalculatedField', 'energyInputOrder', 'energyUsageReading', 'energyProvider', 'energyNotes', 'energyIsFull');
        $this->energyDate = '';
        $this->energySource = '';
        $this->energyUnit = 'L';
    }
}
