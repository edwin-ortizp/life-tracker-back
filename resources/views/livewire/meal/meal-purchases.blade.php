<x-module-shell module="meals">
    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Registrar compra', 'icon' => 'bi-receipt', 'event' => 'open-purchase-editor']" />
    </x-slot:actions>
    <x-ui.management-card id="purchase-history" title="Historial de compras" icon="bi-receipt" :paginator="$purchases" noun="compras" :active-filters="(int) filled($from) + (int) filled($to) + (int) filled($storeId) + (int) filled($itemId)">
        <x-slot:filters>
            <div class="d-flex flex-column gap-3">
                <div class="md-field-pair">
                    <x-ui.field name="from" label="Desde" type="date" wire:model.live="from" />
                    <x-ui.field name="to" label="Hasta" type="date" wire:model.live="to" />
                </div>
                <x-ui.select name="storeId" label="Tienda" :options="$stores" :selected="$storeId" placeholder="Todas" wire:model.live="storeId" />
                <x-ui.select name="itemId" label="Producto" :options="$products" :selected="$itemId" placeholder="Todos" wire:model.live="itemId" />
            </div>
        </x-slot:filters>
        <div class="d-flex flex-column gap-3">
            @forelse ($purchases as $purchase)
                @php $summary = $purchase->summary(); @endphp
                <article class="border rounded p-3" wire:key="purchase-{{ $purchase->id }}">
                    <h2 class="md-title-medium">{{ $purchase->purchased_at->format('d/m/Y H:i') }} · {{ $purchase->store?->name ?? 'Sin tienda' }}</h2>
                    <p class="md-body-medium">{{ $purchase->lines->count() }} líneas · Total pagado: {{ $purchase->total_paid === null ? 'Sin registrar' : '$'.number_format((float) $purchase->total_paid, 2, ',', '.') }}</p>
                    <p class="md-body-small">Suma de líneas: ${{ number_format($summary['lines_total'], 2, ',', '.') }}{{ $summary['lines_total_complete'] ? '' : ' (incompleta)' }}{{ $purchase->ticket_reference ? ' · Ticket '.$purchase->ticket_reference : '' }}</p>
                    <x-ui.row-actions label="Acciones de compra">
                        <x-slot:primary wire:click="openDetail('{{ $purchase->id }}')">Ver detalle</x-slot:primary>
                        <x-ui.menu-item wire:click="$dispatch('open-purchase-editor', { purchaseId: '{{ $purchase->id }}' })">Editar</x-ui.menu-item>
                    </x-ui.row-actions>
                </article>
            @empty
                <p class="md-body-medium">No hay compras registradas para estos filtros.</p>
            @endforelse
        </div>
    </x-ui.management-card>
    <livewire:meal.purchase-editor :key="'purchase-editor-history'" />
    @if ($showDetail && $detail)
    <div x-data="{ detailOpen: $wire.entangle('showDetail').live }" wire:key="purchase-detail-{{ $detail->id }}">
    <x-ui.dialog state="detailOpen" title="Detalle de compra">
        @if ($detail)
            <p>{{ $detail->purchased_at->format('d/m/Y H:i') }} · {{ $detail->store?->name ?? 'Sin tienda' }}</p>
            <p>Medio de pago: {{ $detail->payment_method ?: 'Sin registrar' }} · Ticket: {{ $detail->ticket_reference ?: 'Sin referencia' }}</p>
            @foreach ($detail->lines as $line)
                <article class="border rounded p-3 mb-2">
                    <h3 class="md-title-small">{{ $line->product_name }} · {{ $line->variant_label ?: 'Sin presentación' }}</h3>
                    <p>{{ $line->packages }} paquetes · Precio por paquete: {{ $line->unit_price === null ? 'Sin precio' : '$'.number_format((float) $line->unit_price, 2, ',', '.') }} · Stock añadido: {{ $line->stock_added }} {{ $line->base_unit }}</p>
                    @if ($line->ticket_text)<p>{{ $line->ticket_text }}</p>@endif
                </article>
            @endforeach
            @if ($detail->notes)<p>{{ $detail->notes }}</p>@endif
        @endif
        <x-slot:actions><button type="button" class="md-btn-text" wire:click="closeDetail">Cerrar</button></x-slot:actions>
    </x-ui.dialog>
    </div>
    @endif
</x-module-shell>
