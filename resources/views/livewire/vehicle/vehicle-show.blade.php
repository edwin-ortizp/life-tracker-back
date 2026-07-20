<x-module-shell module="vehicles" :title="$vehicle->name" :subtitle="trim($vehicle->make.' '.$vehicle->model).' · '.ucfirst($vehicle->vehicle_type)" icon="bi-car-front">
    <x-slot:actions>
        <x-module-actions mobile-style="inline"
            :primary="['label' => 'Editar vehículo', 'icon' => 'bi-pencil', 'action' => 'editVehicle']"
            :secondary="[['label' => 'Catálogo', 'icon' => 'bi-tools', 'href' => route('vehicles.catalog')]]" />
    </x-slot:actions>

    @include('livewire.vehicle.partials.vehicle-nav')

    <section class="vehicle-summary-grid">
        <article class="vehicle-identity-card md-card-elevated">
            @if($vehicle->photo_path)<img src="{{ asset('storage/'.$vehicle->photo_path) }}" alt="{{ $vehicle->name }}">@else<div class="vehicle-identity-card__placeholder"><i class="bi bi-car-front"></i></div>@endif
            <div><span>Contador actual</span><strong>{{ $vehicle->current_usage !== null ? number_format($vehicle->current_usage, 0, ',', '.').' '.$vehicle->usage_unit : 'Sin lectura' }}</strong><small>{{ $vehicle->registration_identifier ?: 'Sin placa o identificador' }}</small></div>
        </article>

        <article class="md-card-outlined vehicle-technical-card">
            <div class="vehicle-section-heading"><h2>Ficha técnica</h2><button wire:click="deleteVehicle('{{ $vehicle->id }}')" wire:confirm="¿Eliminar este vehículo y todo su historial?" class="md-btn-icon text-danger" title="Eliminar vehículo"><i class="bi bi-trash"></i></button></div>
            <dl><div><dt>Propulsión</dt><dd class="text-capitalize">{{ $vehicle->power_source }}</dd></div><div><dt>Transmisión</dt><dd class="text-capitalize">{{ str_replace('_', ' ', $vehicle->transmission_type ?: '—') }}</dd></div><div><dt>Año</dt><dd>{{ $vehicle->year ?: '—' }}</dd></div><div><dt>VIN</dt><dd>{{ $vehicle->vin ?: '—' }}</dd></div><div><dt>Motor</dt><dd>{{ $vehicle->engine_displacement ? $vehicle->engine_displacement.' cc' : '—' }}</dd></div><div><dt>Tanque / batería</dt><dd>{{ $vehicle->tank_capacity ? $vehicle->tank_capacity.' L' : ($vehicle->battery_capacity ? $vehicle->battery_capacity.' kWh' : '—') }}</dd></div></dl>
        </article>
    </section>

    <section class="md-card-outlined vehicle-care-card">
        <div class="vehicle-section-heading"><div><h2>Próximos cuidados</h2><p>Fechas y lecturas que requieren atención.</p></div><a href="{{ route('vehicles.maintenance', $vehicle) }}" class="md-btn-text">Ver mantenimiento</a></div>
        <div class="vehicle-care-list">
            @forelse($plans->sortBy(fn ($plan) => ['vencido' => 0, 'proximo' => 1, 'al_dia' => 2][$plan->status_data['status']]) as $plan)
                @php($status = $plan->status_data['status'])
                <article class="vehicle-care-item is-{{ $status }}">
                    <div><strong>{{ $plan->template->name }}</strong><span>@if($plan->status_data['due_date']) Por tiempo: {{ $plan->status_data['due_date']->translatedFormat('d M Y') }} @endif @if($plan->status_data['due_usage']) · {{ number_format($plan->status_data['due_usage'], 0, ',', '.') }} {{ $vehicle->usage_unit }} @endif</span>
                    @if($plan->status_data['usage_projection'])<small>Estimado por uso: {{ $plan->status_data['projected_usage_date']->translatedFormat('d M Y') }} · {{ number_format($plan->status_data['usage_projection']['daily_rate'], 1, ',', '.') }} {{ $vehicle->usage_unit }}/día</small>@elseif($plan->status_data['due_usage'])<small>Estimación por uso: datos insuficientes.</small>@endif</div>
                    <span class="vehicle-status-chip">{{ str_replace('_', ' ', $status) }}</span>
                </article>
            @empty
                <div class="md-empty-state"><div class="md-empty-state__icon"><i class="bi bi-tools"></i></div><h2>Sin planes activos</h2><p>Activa un mantenimiento para comenzar a recibir estimaciones.</p><a href="{{ route('vehicles.maintenance', $vehicle) }}" class="md-btn-tonal">Configurar cuidados</a></div>
            @endforelse
        </div>
    </section>

    @include('livewire.vehicle.partials.vehicle-form')
</x-module-shell>
