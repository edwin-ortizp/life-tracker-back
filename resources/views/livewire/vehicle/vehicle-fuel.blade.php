<x-module-shell module="vehicles" :title="$vehicle->name" :subtitle="$energyUi['heading']" icon="bi-fuel-pump">
    <x-slot:actions>
        <x-module-actions
            :primary="['label' => $energyUi['action'], 'icon' => 'bi-plus-lg', 'action' => 'openEnergyForm']"
            :secondary="[['label' => 'Volver al garaje', 'icon' => 'bi-arrow-left', 'href' => route('vehicles')]]" />
    </x-slot:actions>

    @include('livewire.vehicle.partials.vehicle-nav')

    <section class="vehicle-metrics-grid">
        <article class="md-card-outlined"><span>Último precio</span><strong>{{ $energyAnalytics['latest_price'] !== null ? '$ '.number_format($energyAnalytics['latest_price'], 0, ',', '.') : '—' }}</strong><small>por {{ $energyAnalytics['unit'] }}</small></article>
        <article class="md-card-outlined"><span>Promedio ponderado</span><strong>{{ $energyAnalytics['weighted_average_price'] !== null ? '$ '.number_format($energyAnalytics['weighted_average_price'], 0, ',', '.') : '—' }}</strong><small>por {{ $energyAnalytics['unit'] }}</small></article>
        <article class="md-card-outlined"><span>Rendimiento</span><strong>{{ $energyAnalytics['latest_efficiency'] ? number_format($energyAnalytics['latest_efficiency']['efficiency'], 1, ',', '.') : '—' }}</strong><small>{{ $energyAnalytics['latest_efficiency'] ? $vehicle->usage_unit.'/'.$energyAnalytics['unit'] : 'Requiere dos llenados completos' }}</small></article>
    </section>

    <section class="vehicle-history-section">
        <div class="vehicle-section-heading"><div><h2>Historial</h2><p>{{ $energyLogs->total() }} registros de {{ strtolower($energyUi['tab']) }}</p></div></div>
        <div class="vehicle-history-table md-card-outlined"><div class="table-responsive"><table class="table mb-0 align-middle"><thead><tr><th>Fecha</th><th>Detalle</th><th>Lectura</th><th>Precio unitario</th><th>Costo</th><th></th></tr></thead><tbody>
            @forelse($energyLogs as $log)<tr wire:key="energy-row-{{ $log->id }}"><td>{{ $log->recorded_on->format('d/m/Y') }}</td><td><strong>{{ number_format($log->display_quantity, 2, ',', '.') }} {{ $log->display_unit }}</strong><br><small class="text-capitalize">{{ $log->energy_source }} · {{ $log->is_full ? ($log->energy_source === 'electrico' ? 'Carga completa' : 'Tanque lleno') : 'Parcial' }}{{ $log->provider ? ' · '.$log->provider : '' }}</small></td><td>{{ $log->usage_reading !== null ? number_format($log->usage_reading, 0, ',', '.').' '.$vehicle->usage_unit : '—' }}</td><td>{{ $log->unit_price !== null ? '$ '.number_format($log->unit_price, 0, ',', '.').' / '.$log->display_unit : '—' }}</td><td>{{ $log->cost !== null ? '$ '.number_format($log->cost, 0, ',', '.') : '—' }}</td><td><div class="d-flex"><button wire:click="openEnergyForm('{{ $log->id }}')" class="md-btn-icon" title="Editar"><i class="bi bi-pencil"></i></button><button wire:click="deleteEnergyLog('{{ $log->id }}')" wire:confirm="¿Eliminar este registro?" class="md-btn-icon text-danger" title="Eliminar"><i class="bi bi-trash"></i></button></div></td></tr>
            @empty<tr><td colspan="6"><div class="md-empty-state"><div class="md-empty-state__icon"><i class="bi bi-fuel-pump"></i></div><h2>{{ $energyUi['empty'] }}</h2></div></td></tr>@endforelse
        </tbody></table></div></div>

        <div class="vehicle-history-cards">
            @forelse($energyLogs as $log)
                <article class="md-card-outlined" wire:key="energy-card-{{ $log->id }}"><header><time>{{ $log->recorded_on->translatedFormat('d M Y') }}</time><div><button wire:click="openEnergyForm('{{ $log->id }}')" class="md-btn-icon"><i class="bi bi-pencil"></i></button><button wire:click="deleteEnergyLog('{{ $log->id }}')" wire:confirm="¿Eliminar este registro?" class="md-btn-icon text-danger"><i class="bi bi-trash"></i></button></div></header><strong>{{ number_format($log->display_quantity, 2, ',', '.') }} {{ $log->display_unit }}</strong><span class="text-capitalize">{{ $log->energy_source }} · {{ $log->is_full ? 'Completo' : 'Parcial' }}</span><dl><div><dt>Lectura</dt><dd>{{ $log->usage_reading !== null ? number_format($log->usage_reading, 0, ',', '.').' '.$vehicle->usage_unit : '—' }}</dd></div><div><dt>Precio</dt><dd>{{ $log->unit_price !== null ? '$ '.number_format($log->unit_price, 0, ',', '.') : '—' }}</dd></div><div><dt>Total</dt><dd>{{ $log->cost !== null ? '$ '.number_format($log->cost, 0, ',', '.') : '—' }}</dd></div></dl></article>
            @empty<div class="md-empty-state"><div class="md-empty-state__icon"><i class="bi bi-fuel-pump"></i></div><h2>{{ $energyUi['empty'] }}</h2></div>@endforelse
        </div>
        <div class="vehicle-pagination">{{ $energyLogs->links() }}</div>
    </section>

    @include('livewire.vehicle.partials.energy-form')
</x-module-shell>
