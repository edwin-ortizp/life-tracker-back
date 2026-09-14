<?php

namespace App\Livewire\Vehicle;

use App\Livewire\Vehicle\Concerns\InteractsWithVehicle;
use App\Livewire\Vehicle\Concerns\ManagesMaintenance;
use App\Models\VehicleMaintenancePlan;
use App\Support\VehicleMaintenanceStatus;
use App\Support\VehicleUsageProjection;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Url;
use Livewire\Component;
use App\Livewire\Concerns\WithManagementCard;

/**
 * Plan de mantenimiento: las recomendaciones activas del vehículo y su estado.
 * Lo que ya se hizo vive en el historial de servicios (VehicleServices).
 */
#[Layout('layouts.app')]
class VehicleMaintenance extends Component
{
    use InteractsWithVehicle;
    use ManagesMaintenance;
    use WithManagementCard;

    public const STATUSES = ['vencido' => 'Vencido', 'proximo' => 'Próximo', 'al_dia' => 'Al día'];

    #[Url(as: 'q', history: true, except: '')]
    public string $planSearch = '';

    #[Url(as: 'status', history: true, except: '')]
    public string $planStatus = '';

    public function mount(string $vehicle): void
    {
        $this->initializeVehicle($vehicle);
    }

    public function clearPlanFilters(): void
    {
        $this->reset('planSearch', 'planStatus');
    }

    public function render()
    {
        $vehicle = $this->vehicle();
        $allPlans = VehicleMaintenancePlan::query()->where('vehicle_id', $vehicle->id)->with(['template', 'vehicle', 'latestMaintenanceLog'])->get();
        $usageRate = VehicleUsageProjection::rateForVehicle($vehicle);
        $allPlans->each(fn (VehicleMaintenancePlan $plan) => $plan->setAttribute('status_data', VehicleMaintenanceStatus::forPlan($plan, null, $usageRate ?? false)));
        $order = array_flip(array_keys(self::STATUSES));
        $term = mb_strtolower(trim($this->planSearch));
        $plans = $allPlans
            ->filter(fn (VehicleMaintenancePlan $plan) => $term === '' || str_contains(mb_strtolower($plan->template->name), $term))
            ->filter(fn (VehicleMaintenancePlan $plan) => ! array_key_exists($this->planStatus, self::STATUSES) || $plan->status_data['status'] === $this->planStatus)
            ->sortBy([fn ($a, $b) => ($order[$a->status_data['status']] ?? 9) <=> ($order[$b->status_data['status']] ?? 9), fn ($a, $b) => strcmp($a->template->name, $b->template->name)])
            ->values();
        $totalPlans = $allPlans->count();
        $planOptions = $allPlans->mapWithKeys(fn (VehicleMaintenancePlan $plan) => [$plan->id => $plan->template->name])->sort()->all();
        $templates = $this->showPlanForm ? $this->availableTemplates($vehicle) : collect();
        $energyUi = $this->energyUi($vehicle);
        $statusOptions = self::STATUSES;

        return view('livewire.vehicle.vehicle-maintenance', compact('vehicle', 'plans', 'totalPlans', 'planOptions', 'templates', 'energyUi', 'statusOptions'));
    }
}
