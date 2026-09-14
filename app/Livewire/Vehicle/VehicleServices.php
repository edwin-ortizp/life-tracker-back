<?php

namespace App\Livewire\Vehicle;

use App\Livewire\Concerns\WithManagementCard;
use App\Livewire\Vehicle\Concerns\FiltersByPeriod;
use App\Livewire\Vehicle\Concerns\InteractsWithVehicle;
use App\Livewire\Vehicle\Concerns\ManagesMaintenance;
use App\Models\VehicleMaintenanceLog;
use App\Models\VehicleMaintenancePlan;
use Illuminate\Database\Eloquent\Builder;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Url;
use Livewire\Component;

/**
 * Historial de servicios: todo lo que ya se le hizo al vehículo, con búsqueda, filtros y edición.
 */
#[Layout('layouts.app')]
class VehicleServices extends Component
{
    use FiltersByPeriod;
    use InteractsWithVehicle;
    use ManagesMaintenance;
    use WithManagementCard;

    #[Url(as: 'q', history: true, except: '')]
    public string $serviceSearch = '';

    #[Url(as: 'period', history: true, except: '')]
    public string $servicePeriod = '';

    #[Url(as: 'plan', history: true, except: '')]
    public string $servicePlan = '';

    public function mount(string $vehicle): void
    {
        $this->initializeVehicle($vehicle);
    }

    public function updated(string $property): void
    {
        if (str_starts_with($property, 'service')) {
            $this->resetPage();
        }
    }

    public function clearServiceFilters(): void
    {
        $this->reset('serviceSearch', 'servicePeriod', 'servicePlan');
        $this->resetPage();
    }

    public function render()
    {
        $vehicle = $this->vehicle();
        $planOptions = VehicleMaintenancePlan::query()->where('vehicle_id', $vehicle->id)->with('template')->get()
            ->mapWithKeys(fn (VehicleMaintenancePlan $plan) => [$plan->id => $plan->template->name])->sort()->all();
        $totalCount = VehicleMaintenanceLog::query()->where('vehicle_id', $vehicle->id)->count();
        $maintenanceLogs = $this->filteredLogs($vehicle->id)
            ->with('plan.template')
            ->orderByDesc('performed_on')->orderByDesc('created_at')
            ->paginate($this->perPage());
        $filteredCost = (float) $this->filteredLogs($vehicle->id)->sum('cost');
        $latestService = $totalCount > 0 ? VehicleMaintenanceLog::query()->where('vehicle_id', $vehicle->id)->max('performed_on') : null;
        $periodOptions = static::periodOptions();
        $energyUi = $this->energyUi($vehicle);

        return view('livewire.vehicle.vehicle-services', compact('vehicle', 'planOptions', 'totalCount', 'maintenanceLogs', 'filteredCost', 'latestService', 'periodOptions', 'energyUi'));
    }

    private function filteredLogs(string $vehicleId): Builder
    {
        $term = trim($this->serviceSearch);

        return $this->applyPeriod(VehicleMaintenanceLog::query()->where('vehicle_id', $vehicleId), 'performed_on', $this->servicePeriod)
            ->when($this->servicePlan !== '', fn (Builder $query) => $query->where('vehicle_maintenance_plan_id', $this->servicePlan))
            ->when($term !== '', fn (Builder $query) => $query->where(fn (Builder $match) => $match
                ->where('provider', 'like', "%{$term}%")
                ->orWhere('notes', 'like', "%{$term}%")
                ->orWhereHas('plan.template', fn (Builder $template) => $template->where('name', 'like', "%{$term}%"))));
    }
}
