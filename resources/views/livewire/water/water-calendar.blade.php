<x-module-shell module="water">
    <x-slot:actions>
        <div class="md-date-navigator">
            <button wire:click="previousMonth" class="md-btn-icon" aria-label="Mes anterior"><i class="bi bi-chevron-left"></i></button>
            <button wire:click="today" class="md-date-navigator__today">Este mes</button>
            <span class="md-date-navigator__label text-capitalize">{{ $monthData['label'] }}</span>
            <button wire:click="nextMonth" class="md-btn-icon" aria-label="Mes siguiente"><i class="bi bi-chevron-right"></i></button>
        </div>
    </x-slot:actions>
    <div class="md-module-workspace">
        <section class="md-module-primary md-card-elevated water-calendar-card">
            @include('livewire.water.partials.month-calendar')
        </section>
        <aside class="md-context-rail">
            <x-context-widget title="Cumplimiento" icon="bi-check2-circle" tone="success">
                <div class="water-kpi"><strong>{{ $monthData['completed_days'] }}</strong><span>días con meta alcanzada</span></div>
            </x-context-widget>
            <x-context-widget title="Ritmo del mes" icon="bi-activity">
                <dl class="md-context-list"><div><dt>Días registrados</dt><dd>{{ $monthData['tracked_days'] }}</dd></div><div><dt>Promedio diario</dt><dd>{{ number_format($monthData['average']) }} ml</dd></div></dl>
            </x-context-widget>
        </aside>
    </div>
</x-module-shell>
