<x-module-shell module="vehicles" :title="$vehicle->name" subtitle="Mantenimiento y próximos cuidados" icon="bi-tools">
    @include('livewire.vehicle.partials.vehicle-nav')

    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Activar plan', 'icon' => 'bi-plus-lg', 'action' => 'openPlanForm']" />
    </x-slot:actions>

    <x-ui.management-card id="vehicle-care-plans" title="Plan de cuidados" icon="bi-tools" :count="'('.$plans->count().')'" class="vehicle-plans-section">
    <div class="vehicle-plan-grid">
        @forelse($plans as $plan)
            @php($status = $plan->status_data['status'])
            <article class="md-card-outlined vehicle-plan-card is-{{ $status }}" wire:key="plan-{{ $plan->id }}"><header><div><span>{{ str_replace('_', ' ', $status) }}</span><h2>{{ $plan->template->name }}</h2></div><button wire:click="deletePlan('{{ $plan->id }}')" wire:confirm="¿Desactivar este plan y su historial?" class="md-btn-icon text-danger"><i class="bi bi-trash"></i></button></header><p>{{ $plan->interval_days ? 'Cada '.$plan->interval_days.' días' : '' }}{{ $plan->interval_days && $plan->interval_usage ? ' · ' : '' }}{{ $plan->interval_usage ? 'Cada '.number_format($plan->interval_usage, 0, ',', '.').' '.$vehicle->usage_unit : '' }}</p>@if($plan->status_data['next_due_date'])<small>Próximo por {{ $plan->status_data['next_due_reason'] }}: {{ $plan->status_data['next_due_date']->translatedFormat('d M Y') }}</small>@endif<button wire:click="openMaintenanceForm('{{ $plan->id }}')" class="md-btn-tonal mt-3">Registrar servicio</button></article>
        @empty<div class="md-empty-state md-card-outlined"><div class="md-empty-state__icon"><i class="bi bi-tools"></i></div><h2>No hay mantenimientos programados</h2><p>Activa una plantilla para comenzar.</p></div>@endforelse
    </div>
    </x-ui.management-card>

    <x-ui.management-card id="vehicle-maintenance-history" title="Historial de servicios" icon="bi-clock-history"
                          :count="'('.$maintenanceLogs->total().')'" :paginator="$maintenanceLogs" noun="servicios" class="vehicle-history-section" flush>
        <div class="vehicle-history-table md-card-outlined"><div class="table-responsive"><table class="table mb-0 align-middle"><thead><tr><th>Fecha</th><th>Servicio</th><th>Lectura</th><th>Costo</th><th></th></tr></thead><tbody>@forelse($maintenanceLogs as $log)<tr wire:key="maintenance-row-{{ $log->id }}"><td>{{ $log->performed_on->format('d/m/Y') }}</td><td><strong>{{ $log->plan->template->name }}</strong><br><small>{{ $log->provider }}</small></td><td>{{ $log->usage_reading !== null ? number_format($log->usage_reading, 0, ',', '.').' '.$vehicle->usage_unit : '—' }}</td><td>{{ $log->cost !== null ? '$ '.number_format($log->cost, 0, ',', '.') : '—' }}</td><td><button wire:click="deleteMaintenanceLog('{{ $log->id }}')" wire:confirm="¿Eliminar este servicio?" class="md-btn-icon text-danger"><i class="bi bi-trash"></i></button></td></tr>@empty<tr><td colspan="5"><div class="md-empty-state"><h2>Sin servicios registrados todavía</h2></div></td></tr>@endforelse</tbody></table></div></div>
        <div class="vehicle-history-cards">@forelse($maintenanceLogs as $log)<article class="md-card-outlined" wire:key="maintenance-card-{{ $log->id }}"><header><time>{{ $log->performed_on->translatedFormat('d M Y') }}</time><button wire:click="deleteMaintenanceLog('{{ $log->id }}')" wire:confirm="¿Eliminar este servicio?" class="md-btn-icon text-danger"><i class="bi bi-trash"></i></button></header><strong>{{ $log->plan->template->name }}</strong><span>{{ $log->provider ?: 'Sin proveedor' }}</span><dl><div><dt>Lectura</dt><dd>{{ $log->usage_reading !== null ? number_format($log->usage_reading, 0, ',', '.').' '.$vehicle->usage_unit : '—' }}</dd></div><div><dt>Costo</dt><dd>{{ $log->cost !== null ? '$ '.number_format($log->cost, 0, ',', '.') : '—' }}</dd></div></dl></article>@empty<div class="md-empty-state"><h2>Sin servicios registrados todavía</h2></div>@endforelse</div>
    </x-ui.management-card>

    @include('livewire.vehicle.partials.maintenance-forms')
</x-module-shell>
