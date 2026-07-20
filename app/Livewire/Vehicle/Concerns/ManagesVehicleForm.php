<?php

namespace App\Livewire\Vehicle\Concerns;

use App\Models\Vehicle;
use App\Support\VehicleUsageTimeline;
use Illuminate\Support\Facades\Storage;
use Livewire\WithFileUploads;

trait ManagesVehicleForm
{
    use WithFileUploads;

    public bool $showVehicleForm = false;

    public ?string $editingVehicleId = null;

    public $photo = null;

    public string $vehicleName = '';

    public string $vehicleType = 'automovil';

    public string $powerSource = 'gasolina';

    public string $fuelVolumeUnit = 'gal';

    public string $usageUnit = 'km';

    public ?float $currentUsage = null;

    public string $make = '';

    public string $model = '';

    public ?int $year = null;

    public string $registrationIdentifier = '';

    public string $vin = '';

    public ?float $engineDisplacement = null;

    public ?float $tankCapacity = null;

    public ?float $batteryCapacity = null;

    public string $transmissionType = 'no_aplica';

    public function openVehicleForm(?string $id = null): void
    {
        $this->resetVehicleForm();
        if ($id && ($vehicle = Vehicle::query()->find($id))) {
            $this->editingVehicleId = $vehicle->id;
            $this->vehicleName = $vehicle->name;
            $this->vehicleType = $vehicle->vehicle_type;
            $this->powerSource = $vehicle->power_source;
            $this->transmissionType = $vehicle->transmission_type ?? 'no_aplica';
            $this->fuelVolumeUnit = $vehicle->fuel_volume_unit ?? 'gal';
            $this->usageUnit = $vehicle->usage_unit ?? '';
            $this->currentUsage = $vehicle->current_usage === null ? null : (float) $vehicle->current_usage;
            $this->make = $vehicle->make ?? '';
            $this->model = $vehicle->model ?? '';
            $this->year = $vehicle->year;
            $this->registrationIdentifier = $vehicle->registration_identifier ?? '';
            $this->vin = $vehicle->vin ?? '';
            $this->engineDisplacement = $vehicle->engine_displacement === null ? null : (float) $vehicle->engine_displacement;
            $this->tankCapacity = $vehicle->tank_capacity === null ? null : (float) $vehicle->tank_capacity;
            $this->batteryCapacity = $vehicle->battery_capacity === null ? null : (float) $vehicle->battery_capacity;
        }
        $this->showVehicleForm = true;
    }

    public function saveVehicle(): void
    {
        $data = $this->validate([
            'vehicleName' => ['required', 'string', 'max:120'],
            'vehicleType' => ['required', 'in:automovil,motocicleta,bicicleta,patineta,otro'],
            'powerSource' => ['required', 'in:gasolina,diesel,electrico,hibrido,humana,ninguna'],
            'transmissionType' => ['required', 'in:manual,automatica,cvt,automatizada,no_aplica'],
            'fuelVolumeUnit' => ['nullable', 'in:gal,L'],
            'usageUnit' => ['nullable', 'in:km,hours'],
            'currentUsage' => ['nullable', 'numeric', 'min:0'],
            'make' => ['nullable', 'string', 'max:80'], 'model' => ['nullable', 'string', 'max:80'],
            'year' => ['nullable', 'integer', 'min:1886', 'max:'.(now()->year + 1)],
            'registrationIdentifier' => ['nullable', 'string', 'max:80'], 'vin' => ['nullable', 'string', 'max:80'],
            'engineDisplacement' => ['nullable', 'numeric', 'min:0'], 'tankCapacity' => ['nullable', 'numeric', 'min:0'],
            'batteryCapacity' => ['nullable', 'numeric', 'min:0'], 'photo' => ['nullable', 'image', 'max:2048'],
        ]);

        $vehicle = $this->editingVehicleId ? Vehicle::query()->findOrFail($this->editingVehicleId) : new Vehicle;
        $usageChanged = ! $vehicle->exists || $this->numericValuesDiffer($vehicle->current_usage, $data['currentUsage']);
        if ($vehicle->exists && $usageChanged && $data['currentUsage'] !== null) {
            $conflict = VehicleUsageTimeline::conflict($vehicle, today()->toDateString(), (float) $data['currentUsage'], 'manual', $vehicle->id);
            if ($conflict) {
                $this->addError('currentUsage', $conflict);

                return;
            }
        }

        $attributes = [
            'name' => $data['vehicleName'], 'vehicle_type' => $data['vehicleType'], 'power_source' => $data['powerSource'],
            'transmission_type' => $data['transmissionType'],
            'fuel_volume_unit' => $this->usesLiquidFuel($data['powerSource']) ? ($data['fuelVolumeUnit'] ?: 'gal') : null,
            'usage_unit' => $data['usageUnit'] ?: null, 'make' => $data['make'] ?: null, 'model' => $data['model'] ?: null,
            'year' => $data['year'], 'registration_identifier' => $data['registrationIdentifier'] ?: null, 'vin' => $data['vin'] ?: null,
            'engine_displacement' => $data['engineDisplacement'], 'tank_capacity' => $data['tankCapacity'], 'battery_capacity' => $data['batteryCapacity'],
        ];
        if ($usageChanged) {
            $attributes['manual_usage_reading'] = $data['currentUsage'];
            $attributes['manual_usage_recorded_at'] = $data['currentUsage'] === null ? null : now();
            $attributes['current_usage'] = $data['currentUsage'];
        }
        if ($this->photo) {
            if ($vehicle->photo_path) {
                Storage::disk('public')->delete($vehicle->photo_path);
            }
            $attributes['photo_path'] = $this->photo->store('vehicles/'.auth()->id(), 'public');
        }

        $vehicle->fill($attributes)->save();
        VehicleUsageTimeline::recalculateCurrentUsage($vehicle);
        $this->showVehicleForm = false;
        $this->resetVehicleForm();
        $this->vehicleSaved($vehicle);
    }

    public function deleteVehicle(string $id): void
    {
        $vehicle = Vehicle::query()->find($id);
        if (! $vehicle) {
            return;
        }
        if ($vehicle->photo_path) {
            Storage::disk('public')->delete($vehicle->photo_path);
        }
        $vehicle->delete();
        $this->vehicleDeleted();
    }

    protected function vehicleSaved(Vehicle $vehicle): void {}

    protected function vehicleDeleted(): void {}

    private function numericValuesDiffer(mixed $left, mixed $right): bool
    {
        if ($left === null || $right === null) {
            return $left !== $right;
        }

        return abs((float) $left - (float) $right) > 0.001;
    }

    private function resetVehicleForm(): void
    {
        $this->reset('editingVehicleId', 'photo', 'vehicleName', 'make', 'model', 'year', 'registrationIdentifier', 'vin', 'engineDisplacement', 'tankCapacity', 'batteryCapacity', 'currentUsage', 'fuelVolumeUnit');
        $this->vehicleType = 'automovil';
        $this->powerSource = 'gasolina';
        $this->transmissionType = 'no_aplica';
        $this->fuelVolumeUnit = 'gal';
        $this->usageUnit = 'km';
    }
}
