<?php

namespace App\Livewire\Vehicle;

use App\Livewire\Vehicle\Concerns\FiltersByPeriod;
use App\Livewire\Vehicle\Concerns\InteractsWithVehicle;
use App\Livewire\Vehicle\Concerns\ManagesEnergyLogs;
use App\Models\VehicleEnergyLog;
use App\Support\VehicleEnergyAnalytics;
use Illuminate\Database\Eloquent\Builder;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Url;
use Livewire\Component;
use App\Livewire\Concerns\WithManagementCard;

#[Layout('layouts.app')]
class VehicleFuel extends Component
{
    use FiltersByPeriod;
    use InteractsWithVehicle;
    use ManagesEnergyLogs;
    use WithManagementCard;

    #[Url(as: 'q', history: true, except: '')]
    public string $fuelSearch = '';

    #[Url(as: 'period', history: true, except: '')]
    public string $fuelPeriod = '';

    #[Url(as: 'fill', history: true, except: '')]
    public string $fuelFill = '';

    #[Url(as: 'source', history: true, except: '')]
    public string $fuelSource = '';

    public function mount(string $vehicle): void
    {
        $this->initializeVehicle($vehicle);
        abort_if(empty($this->energySources($this->vehicle())), 404);
    }

    public function updated(string $property): void
    {
        if (str_starts_with($property, 'fuel')) {
            $this->resetPage();
        }
    }

    public function clearFuelFilters(): void
    {
        $this->reset('fuelSearch', 'fuelPeriod', 'fuelFill', 'fuelSource');
        $this->resetPage();
    }

    public function render()
    {
        $vehicle = $this->vehicle();
        $energyUi = $this->energyUi($vehicle, $this->editingEnergyLogId);
        $energySources = $this->energySources($vehicle);
        $energyAnalytics = VehicleEnergyAnalytics::summaryForVehicle($vehicle);
        $term = trim($this->fuelSearch);
        $totalCount = VehicleEnergyLog::query()->where('vehicle_id', $vehicle->id)->count();
        $energyLogs = $this->applyPeriod(VehicleEnergyLog::query()->where('vehicle_id', $vehicle->id), 'recorded_on', $this->fuelPeriod)
            ->when(in_array($this->fuelFill, ['full', 'partial'], true), fn (Builder $query) => $query->where('is_full', $this->fuelFill === 'full'))
            ->when(in_array($this->fuelSource, $energySources, true), fn (Builder $query) => $query->where('energy_source', $this->fuelSource))
            ->when($term !== '', fn (Builder $query) => $query->where(fn (Builder $match) => $match
                ->where('provider', 'like', "%{$term}%")->orWhere('notes', 'like', "%{$term}%")))
            ->orderByDesc('recorded_on')->orderByDesc('created_at')
            ->paginate($this->perPage());
        VehicleEnergyAnalytics::annotate($energyLogs->getCollection(), $vehicle);
        $periodOptions = static::periodOptions();

        return view('livewire.vehicle.vehicle-fuel', compact('vehicle', 'energyUi', 'energySources', 'energyAnalytics', 'energyLogs', 'totalCount', 'periodOptions'));
    }
}
