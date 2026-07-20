<x-module-shell module="vehicles">
    <x-slot:actions>
        <x-module-actions mobile-style="inline"
            :primary="['label' => 'Añadir vehículo', 'icon' => 'bi-plus-lg', 'action' => 'openVehicleForm']"
            :secondary="[['label' => 'Catálogo de mantenimientos', 'icon' => 'bi-tools', 'href' => route('vehicles.catalog')]]" />
    </x-slot:actions>

    @if($vehicles->isEmpty())
        <div class="md-empty-state md-card-outlined">
            <div class="md-empty-state__icon"><i class="bi bi-car-front"></i></div>
            <h2>Tu garaje está vacío</h2>
            <p>Añade tu automóvil, moto, bicicleta o patineta para programar sus cuidados.</p>
            <button wire:click="openVehicleForm" class="md-btn-filled mt-2">Crear mi primer vehículo</button>
        </div>
    @else
        <div class="vehicle-garage-grid">
            @foreach($vehicles as $vehicle)
                <a href="{{ route('vehicles.show', $vehicle) }}" class="vehicle-garage-card md-card-outlined" wire:key="vehicle-{{ $vehicle->id }}">
                    @if($vehicle->photo_path)
                        <img src="{{ asset('storage/'.$vehicle->photo_path) }}" alt="{{ $vehicle->name }}">
                    @else
                        <span class="vehicle-garage-card__icon"><i class="bi bi-{{ $vehicle->vehicle_type === 'motocicleta' ? 'scooter' : ($vehicle->vehicle_type === 'bicicleta' ? 'bicycle' : 'car-front') }}"></i></span>
                    @endif
                    <span class="vehicle-garage-card__body">
                        <strong>{{ $vehicle->name }}</strong>
                        <small>{{ trim($vehicle->make.' '.$vehicle->model) ?: ucfirst($vehicle->vehicle_type) }}</small>
                        <span>{{ $vehicle->current_usage !== null ? number_format($vehicle->current_usage, 0, ',', '.').' '.$vehicle->usage_unit : 'Sin lectura actual' }}</span>
                    </span>
                    <i class="bi bi-chevron-right vehicle-garage-card__chevron"></i>
                </a>
            @endforeach
        </div>
    @endif

    @include('livewire.vehicle.partials.vehicle-form')
</x-module-shell>
