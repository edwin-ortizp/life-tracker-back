<div class="vehicle-detail-toolbar">
    <a href="{{ route('vehicles') }}" class="md-btn-text"><i class="bi bi-arrow-left"></i> Garaje</a>
    <nav class="vehicle-tabs" aria-label="Secciones de {{ $vehicle->name }}">
        <a href="{{ route('vehicles.show', $vehicle) }}" class="{{ request()->routeIs('vehicles.show') ? 'is-active' : '' }}" @if(request()->routeIs('vehicles.show')) aria-current="page" @endif><i class="bi bi-speedometer2"></i><span>Resumen</span></a>
        @if(!in_array($vehicle->power_source, ['humana', 'ninguna'], true))
            <a href="{{ route('vehicles.fuel', $vehicle) }}" class="{{ request()->routeIs('vehicles.fuel') ? 'is-active' : '' }}" @if(request()->routeIs('vehicles.fuel')) aria-current="page" @endif><i class="bi bi-fuel-pump"></i><span>{{ $energyUi['tab'] ?? 'Energía' }}</span></a>
        @endif
        <a href="{{ route('vehicles.maintenance', $vehicle) }}" class="{{ request()->routeIs('vehicles.maintenance') ? 'is-active' : '' }}" @if(request()->routeIs('vehicles.maintenance')) aria-current="page" @endif><i class="bi bi-tools"></i><span>Mantenimiento</span></a>
    </nav>
</div>
