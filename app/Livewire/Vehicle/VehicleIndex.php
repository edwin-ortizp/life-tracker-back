<?php

namespace App\Livewire\Vehicle;

use App\Models\MaintenanceTemplate;
use App\Models\Vehicle;
use App\Models\VehicleEnergyLog;
use App\Models\VehicleMaintenanceLog;
use App\Models\VehicleMaintenancePlan;
use App\Support\VehicleMaintenanceStatus;
use App\Support\VehicleEnergyAnalytics;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;
use Livewire\WithFileUploads;

#[Layout('layouts.app')]
#[Title('Vehículos')]
class VehicleIndex extends Component
{
    use WithFileUploads;

    public ?string $selectedVehicleId = null;
    public string $activeTab = 'resumen';
    public bool $showCatalog = false;
    public bool $showVehicleForm = false;
    public bool $showEnergyForm = false;
    public bool $showPlanForm = false;
    public bool $showMaintenanceForm = false;
    public bool $showTemplateForm = false;
    public ?string $editingVehicleId = null;
    public ?string $editingTemplateId = null;
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

    public string $energyDate = '';
    public string $energySource = '';
    public ?float $energyQuantity = null;
    public string $energyUnit = 'L';
    public bool $energyIsFull = false;
    public ?float $energyCost = null;
    public ?float $energyUsageReading = null;
    public string $energyProvider = '';
    public string $energyNotes = '';

    public string $templateId = '';
    public ?int $planIntervalDays = null;
    public ?float $planIntervalUsage = null;
    public string $planBaselineDate = '';
    public ?float $planBaselineUsage = null;

    public ?string $maintenancePlanId = null;
    public string $maintenanceDate = '';
    public ?float $maintenanceUsageReading = null;
    public ?float $maintenanceCost = null;
    public string $maintenanceProvider = '';
    public string $maintenanceNotes = '';

    public string $templateName = '';
    public string $templateCategory = '';
    public string $templateDescription = '';
    public array $templateVehicleTypes = [];
    public array $templatePowerSources = [];
    public array $templateTransmissionTypes = [];
    public ?int $templateDefaultIntervalDays = null;
    public ?float $templateDefaultIntervalUsage = null;
    public string $catalogMessage = '';
    public string $catalogSearch = '';
    public string $catalogCategory = '';
    public string $catalogSource = '';
    public string $catalogVehicleType = '';
    public string $catalogPowerSource = '';
    public string $catalogTransmissionType = '';

    public function mount(): void
    {
        $this->selectedVehicleId = Vehicle::orderBy('name')->value('id');
    }

    public function selectVehicle(string $id): void
    {
        if (Vehicle::find($id)) {
            $this->selectedVehicleId = $id;
            $this->activeTab = 'resumen';
            $this->showCatalog = false;
        }
    }

    public function openCatalog(): void
    {
        $this->showCatalog = true;
        $this->catalogMessage = '';
    }

    public function closeCatalog(): void
    {
        $this->showCatalog = false;
        $this->catalogMessage = '';
    }

    public function clearCatalogFilters(): void
    {
        $this->reset('catalogSearch', 'catalogCategory', 'catalogSource', 'catalogVehicleType', 'catalogPowerSource', 'catalogTransmissionType');
    }

    public function openVehicleForm(?string $id = null): void
    {
        $this->resetVehicleForm();
        if ($id && ($vehicle = Vehicle::find($id))) {
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

        $attributes = [
            'name' => $data['vehicleName'], 'vehicle_type' => $data['vehicleType'], 'power_source' => $data['powerSource'],
            'transmission_type' => $data['transmissionType'],
            'fuel_volume_unit' => $this->usesLiquidFuel($data['powerSource']) ? ($data['fuelVolumeUnit'] ?: 'gal') : null,
            'usage_unit' => $data['usageUnit'] ?: null, 'current_usage' => $data['currentUsage'], 'make' => $data['make'] ?: null,
            'model' => $data['model'] ?: null, 'year' => $data['year'], 'registration_identifier' => $data['registrationIdentifier'] ?: null,
            'vin' => $data['vin'] ?: null, 'engine_displacement' => $data['engineDisplacement'], 'tank_capacity' => $data['tankCapacity'],
            'battery_capacity' => $data['batteryCapacity'],
        ];
        $vehicle = $this->editingVehicleId ? Vehicle::findOrFail($this->editingVehicleId) : new Vehicle();
        if ($this->photo) {
            if ($vehicle->photo_path) Storage::disk('public')->delete($vehicle->photo_path);
            $attributes['photo_path'] = $this->photo->store('vehicles/'.auth()->id(), 'public');
        }
        $vehicle->fill($attributes)->save();
        $this->selectedVehicleId = $vehicle->id;
        $this->showVehicleForm = false;
        $this->resetVehicleForm();
    }

    public function deleteVehicle(string $id): void
    {
        $vehicle = Vehicle::find($id);
        if (!$vehicle) return;
        if ($vehicle->photo_path) Storage::disk('public')->delete($vehicle->photo_path);
        $vehicle->delete();
        if ($this->selectedVehicleId === $id) $this->selectedVehicleId = Vehicle::orderBy('name')->value('id');
    }

    public function openEnergyForm(): void
    {
        $vehicle = $this->selectedVehicle();
        if (!$vehicle) return;
        $this->resetEnergyForm();
        $this->energyDate = today()->toDateString();
        $this->energySource = $this->energySources($vehicle)[0];
        $this->energyUnit = $this->energyUnitFor($vehicle, $this->energySource);
        $this->energyUsageReading = $vehicle->current_usage === null ? null : (float) $vehicle->current_usage;
        $this->showEnergyForm = true;
    }

    public function updatedEnergySource(): void
    {
        if ($vehicle = $this->selectedVehicle()) {
            $this->energyUnit = $this->energyUnitFor($vehicle, $this->energySource);
        }
    }

    public function setFuelVolumeUnit(string $unit): void
    {
        $vehicle = $this->selectedVehicle();
        if (!$vehicle || !$this->usesLiquidFuel($vehicle->power_source) || !in_array($unit, ['gal', 'L'], true)) return;
        $vehicle->update(['fuel_volume_unit' => $unit]);
    }

    public function saveEnergyLog(): void
    {
        $vehicle = $this->selectedVehicle();
        if (!$vehicle) return;
        $data = $this->validate([
            'energyDate' => ['required', 'date'], 'energySource' => ['required', Rule::in($this->energySources($vehicle))],
            'energyQuantity' => ['required', 'numeric', 'gt:0'], 'energyUnit' => ['required', Rule::in([$this->energyUnitFor($vehicle, $this->energySource)])],
            'energyIsFull' => ['boolean'],
            'energyCost' => ['nullable', 'numeric', 'min:0'], 'energyUsageReading' => ['nullable', 'numeric', 'min:0'],
            'energyProvider' => ['nullable', 'string', 'max:120'], 'energyNotes' => ['nullable', 'string', 'max:1000'],
        ]);
        VehicleEnergyLog::create([
            'vehicle_id' => $vehicle->id, 'recorded_on' => $data['energyDate'], 'energy_source' => $data['energySource'],
            'quantity' => $data['energyQuantity'], 'unit' => $data['energyUnit'], 'is_full' => $data['energyIsFull'], 'cost' => $data['energyCost'],
            'usage_reading' => $data['energyUsageReading'], 'provider' => $data['energyProvider'] ?: null, 'notes' => $data['energyNotes'] ?: null,
        ]);
        $this->updateCurrentUsage($vehicle, $data['energyUsageReading']);
        $this->showEnergyForm = false;
    }

    public function deleteEnergyLog(string $id): void
    {
        VehicleEnergyLog::find($id)?->delete();
    }

    public function openPlanForm(): void
    {
        $vehicle = $this->selectedVehicle();
        if (!$vehicle) return;
        $this->resetPlanForm();
        $this->planBaselineDate = today()->toDateString();
        $this->planBaselineUsage = $vehicle->current_usage === null ? null : (float) $vehicle->current_usage;
        $this->showPlanForm = true;
    }

    public function updatedTemplateId(): void
    {
        $template = $this->visibleTemplates()->find($this->templateId);
        if ($template) {
            $this->planIntervalDays = $template->default_interval_days;
            $this->planIntervalUsage = $template->default_interval_usage === null ? null : (float) $template->default_interval_usage;
        }
    }

    public function savePlan(): void
    {
        $vehicle = $this->selectedVehicle();
        if (!$vehicle) return;
        $data = $this->validate([
            'templateId' => ['required', 'exists:maintenance_templates,id'], 'planIntervalDays' => ['nullable', 'integer', 'min:1'],
            'planIntervalUsage' => ['nullable', 'numeric', 'gt:0'], 'planBaselineDate' => ['nullable', 'date'],
            'planBaselineUsage' => ['nullable', 'numeric', 'min:0'],
        ]);
        if (!$data['planIntervalDays'] && !$data['planIntervalUsage']) {
            $this->addError('planIntervalDays', 'Indica al menos un intervalo.'); return;
        }
        $template = $this->availableTemplates($vehicle)->firstWhere('id', $data['templateId']);
        if (!$template) { $this->addError('templateId', 'La plantilla no aplica a este vehículo.'); return; }
        VehicleMaintenancePlan::create([
            'vehicle_id' => $vehicle->id, 'maintenance_template_id' => $template->id, 'interval_days' => $data['planIntervalDays'],
            'interval_usage' => $data['planIntervalUsage'], 'baseline_date' => $data['planBaselineDate'] ?: null,
            'baseline_usage' => $data['planBaselineUsage'],
        ]);
        $this->showPlanForm = false;
    }

    public function deletePlan(string $id): void
    {
        VehicleMaintenancePlan::find($id)?->delete();
    }

    public function openMaintenanceForm(string $planId): void
    {
        $plan = VehicleMaintenancePlan::find($planId);
        $vehicle = $this->selectedVehicle();
        if (!$plan || !$vehicle || $plan->vehicle_id !== $vehicle->id) return;
        $this->resetMaintenanceForm();
        $this->maintenancePlanId = $plan->id;
        $this->maintenanceDate = today()->toDateString();
        $this->maintenanceUsageReading = $vehicle->current_usage === null ? null : (float) $vehicle->current_usage;
        $this->showMaintenanceForm = true;
    }

    public function saveMaintenanceLog(): void
    {
        $vehicle = $this->selectedVehicle();
        $plan = $this->maintenancePlanId ? VehicleMaintenancePlan::find($this->maintenancePlanId) : null;
        if (!$vehicle || !$plan || $plan->vehicle_id !== $vehicle->id) return;
        $data = $this->validate([
            'maintenanceDate' => ['required', 'date'], 'maintenanceUsageReading' => ['nullable', 'numeric', 'min:0'],
            'maintenanceCost' => ['nullable', 'numeric', 'min:0'], 'maintenanceProvider' => ['nullable', 'string', 'max:120'],
            'maintenanceNotes' => ['nullable', 'string', 'max:1000'],
        ]);
        VehicleMaintenanceLog::create([
            'vehicle_id' => $vehicle->id, 'vehicle_maintenance_plan_id' => $plan->id, 'performed_on' => $data['maintenanceDate'],
            'usage_reading' => $data['maintenanceUsageReading'], 'cost' => $data['maintenanceCost'],
            'provider' => $data['maintenanceProvider'] ?: null, 'notes' => $data['maintenanceNotes'] ?: null,
        ]);
        $this->updateCurrentUsage($vehicle, $data['maintenanceUsageReading']);
        $this->showMaintenanceForm = false;
    }

    public function deleteMaintenanceLog(string $id): void
    {
        VehicleMaintenanceLog::find($id)?->delete();
    }

    private function updateCurrentUsage(Vehicle $vehicle, ?float $reading): void
    {
        if ($reading !== null && ($vehicle->current_usage === null || $reading > (float) $vehicle->current_usage)) {
            $vehicle->update(['current_usage' => $reading]);
        }
    }

    private function selectedVehicle(): ?Vehicle
    {
        return $this->selectedVehicleId ? Vehicle::find($this->selectedVehicleId) : null;
    }

    private function availableTemplates(Vehicle $vehicle)
    {
        return $this->visibleTemplates()->orderBy('name')->get()->filter(function (MaintenanceTemplate $template) use ($vehicle) {
            $typeMatches = empty($template->vehicle_types) || in_array($vehicle->vehicle_type, $template->vehicle_types, true);
            $powerMatches = empty($template->power_sources) || in_array($vehicle->power_source, $template->power_sources, true);
            $transmissionMatches = empty($template->transmission_types)
                || ($vehicle->transmission_type && in_array($vehicle->transmission_type, $template->transmission_types, true));
            return $typeMatches && $powerMatches && $transmissionMatches;
        })->values();
    }

    public function openTemplateForm(?string $id = null): void
    {
        $this->resetTemplateForm();
        if ($id && ($template = MaintenanceTemplate::where('user_id', auth()->id())->find($id))) {
            $this->editingTemplateId = $template->id;
            $this->templateName = $template->name;
            $this->templateCategory = $template->category;
            $this->templateDescription = $template->description ?? '';
            $this->templateVehicleTypes = $template->vehicle_types ?? [];
            $this->templatePowerSources = $template->power_sources ?? [];
            $this->templateTransmissionTypes = $template->transmission_types ?? [];
            $this->templateDefaultIntervalDays = $template->default_interval_days;
            $this->templateDefaultIntervalUsage = $template->default_interval_usage === null ? null : (float) $template->default_interval_usage;
        }
        $this->showTemplateForm = true;
    }

    public function saveTemplate(): void
    {
        $template = $this->editingTemplateId
            ? MaintenanceTemplate::where('user_id', auth()->id())->findOrFail($this->editingTemplateId)
            : new MaintenanceTemplate(['user_id' => auth()->id()]);

        $data = $this->validate([
            'templateName' => [
                'required', 'string', 'max:120',
                Rule::unique('maintenance_templates', 'name')->where(fn ($query) => $query->where('user_id', auth()->id()))->ignore($template->id),
            ],
            'templateCategory' => ['required', 'string', 'max:80'],
            'templateDescription' => ['nullable', 'string', 'max:1000'],
            'templateVehicleTypes' => ['array'], 'templateVehicleTypes.*' => ['in:automovil,motocicleta,bicicleta,patineta,otro'],
            'templatePowerSources' => ['array'], 'templatePowerSources.*' => ['in:gasolina,diesel,electrico,hibrido,humana,ninguna'],
            'templateTransmissionTypes' => ['array'], 'templateTransmissionTypes.*' => ['in:manual,automatica,cvt,automatizada,no_aplica'],
            'templateDefaultIntervalDays' => ['nullable', 'integer', 'min:1'],
            'templateDefaultIntervalUsage' => ['nullable', 'numeric', 'gt:0'],
        ]);

        $template->fill([
            'name' => $data['templateName'], 'category' => $data['templateCategory'],
            'description' => $data['templateDescription'] ?: null,
            'vehicle_types' => $data['templateVehicleTypes'] ?: null,
            'power_sources' => $data['templatePowerSources'] ?: null,
            'transmission_types' => $data['templateTransmissionTypes'] ?: null,
            'default_interval_days' => $data['templateDefaultIntervalDays'],
            'default_interval_usage' => $data['templateDefaultIntervalUsage'],
        ])->save();

        $this->showTemplateForm = false;
        $this->catalogMessage = $this->editingTemplateId ? 'Plantilla actualizada.' : 'Plantilla creada.';
        $this->resetTemplateForm();
    }

    public function deleteTemplate(string $id): void
    {
        $template = MaintenanceTemplate::where('user_id', auth()->id())->find($id);
        if (!$template) {
            $this->catalogMessage = 'Solo puedes eliminar tus propias plantillas.';
            return;
        }
        if (VehicleMaintenancePlan::where('maintenance_template_id', $template->id)->exists()) {
            $this->catalogMessage = 'No se puede eliminar una plantilla con planes de mantenimiento asociados.';
            return;
        }
        $template->delete();
        $this->catalogMessage = 'Plantilla eliminada.';
    }

    private function visibleTemplates()
    {
        return MaintenanceTemplate::availableTo((int) auth()->id());
    }

    private function usesLiquidFuel(string $powerSource): bool
    {
        return in_array($powerSource, ['gasolina', 'diesel', 'hibrido'], true);
    }

    private function energySources(Vehicle $vehicle): array
    {
        return match ($vehicle->power_source) {
            'gasolina' => ['gasolina'],
            'diesel' => ['diesel'],
            'electrico' => ['electrico'],
            'hibrido' => ['gasolina', 'electrico'],
            default => [],
        };
    }

    private function energyUnitFor(Vehicle $vehicle, string $source): string
    {
        return $source === 'electrico' ? 'kWh' : ($vehicle->fuel_volume_unit ?: 'gal');
    }

    private function resetVehicleForm(): void
    {
        $this->reset('editingVehicleId', 'photo', 'vehicleName', 'make', 'model', 'year', 'registrationIdentifier', 'vin', 'engineDisplacement', 'tankCapacity', 'batteryCapacity', 'currentUsage', 'fuelVolumeUnit');
        $this->vehicleType = 'automovil'; $this->powerSource = 'gasolina'; $this->transmissionType = 'no_aplica'; $this->fuelVolumeUnit = 'gal'; $this->usageUnit = 'km';
    }

    private function resetEnergyForm(): void
    {
        $this->reset('energyQuantity', 'energyCost', 'energyUsageReading', 'energyProvider', 'energyNotes', 'energyIsFull');
        $this->energyDate = ''; $this->energySource = ''; $this->energyUnit = 'L';
    }

    private function resetPlanForm(): void
    {
        $this->reset('templateId', 'planIntervalDays', 'planIntervalUsage', 'planBaselineUsage'); $this->planBaselineDate = '';
    }

    private function resetMaintenanceForm(): void
    {
        $this->reset('maintenancePlanId', 'maintenanceUsageReading', 'maintenanceCost', 'maintenanceProvider', 'maintenanceNotes'); $this->maintenanceDate = '';
    }

    private function resetTemplateForm(): void
    {
        $this->reset(
            'editingTemplateId', 'templateName', 'templateCategory', 'templateDescription', 'templateVehicleTypes',
            'templatePowerSources', 'templateTransmissionTypes', 'templateDefaultIntervalDays', 'templateDefaultIntervalUsage'
        );
    }

    public function render()
    {
        $vehicles = Vehicle::orderBy('name')->get();
        $vehicle = $this->selectedVehicle();
        $plans = collect(); $energyLogs = collect(); $maintenanceLogs = collect(); $templates = collect(); $energyAnalytics = null; $energySources = [];
        $catalogCategories = $this->visibleTemplates()
            ->orderBy('category')
            ->distinct()
            ->pluck('category');

        $catalogQuery = $this->visibleTemplates();
        if (trim($this->catalogSearch) !== '') {
            $search = '%'.trim($this->catalogSearch).'%';
            $catalogQuery->where(fn ($query) => $query->where('name', 'like', $search)->orWhere('description', 'like', $search));
        }
        if ($this->catalogCategory !== '') $catalogQuery->where('category', $this->catalogCategory);
        if ($this->catalogSource === 'base') $catalogQuery->whereNull('user_id');
        if ($this->catalogSource === 'personal') $catalogQuery->where('user_id', auth()->id());
        if ($this->catalogVehicleType !== '') {
            $catalogQuery->where(fn ($query) => $query->whereNull('vehicle_types')->orWhereJsonContains('vehicle_types', $this->catalogVehicleType));
        }
        if ($this->catalogPowerSource !== '') {
            $catalogQuery->where(fn ($query) => $query->whereNull('power_sources')->orWhereJsonContains('power_sources', $this->catalogPowerSource));
        }
        if ($this->catalogTransmissionType !== '') {
            $catalogQuery->where(fn ($query) => $query->whereNull('transmission_types')->orWhereJsonContains('transmission_types', $this->catalogTransmissionType));
        }
        $catalogTemplates = $catalogQuery->orderBy('category')->orderBy('name')->get();
        if ($vehicle) {
            $plans = VehicleMaintenancePlan::where('vehicle_id', $vehicle->id)->with(['template', 'vehicle', 'maintenanceLogs'])->get();
            $plans->each(fn (VehicleMaintenancePlan $plan) => $plan->setAttribute('status_data', VehicleMaintenanceStatus::forPlan($plan)));
            $energyAnalytics = VehicleEnergyAnalytics::forVehicle($vehicle);
            $energyLogs = $energyAnalytics['all_logs']->sortByDesc(fn (VehicleEnergyLog $log) => $log->recorded_on->format('Y-m-d').$log->created_at->format('H:i:s'));
            $energySources = $this->energySources($vehicle);
            $maintenanceLogs = VehicleMaintenanceLog::where('vehicle_id', $vehicle->id)->with('plan.template')->latest('performed_on')->get();
            $templates = $this->availableTemplates($vehicle);
        }
        return view('livewire.vehicle.vehicle-index', compact('vehicles', 'vehicle', 'plans', 'energyLogs', 'maintenanceLogs', 'templates', 'energyAnalytics', 'energySources', 'catalogTemplates', 'catalogCategories'));
    }
}
