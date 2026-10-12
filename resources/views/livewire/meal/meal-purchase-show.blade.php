<x-module-shell module="meals" title="Detalle de compra" :tabs="$detailTabs" :back="['href' => $backUrl, 'label' => 'Volver al historial de compras']">
    <article class="purchase-invoice" aria-labelledby="purchase-invoice-title">
        <header class="purchase-invoice__header">
            <span class="purchase-invoice__mark" aria-hidden="true"><i class="bi bi-receipt"></i></span>
            <div class="purchase-invoice__identity"><p class="md-label-large">Comprobante de compra</p><h2 id="purchase-invoice-title" class="md-headline-small">{{ $purchase->store?->name ?? 'Sin tienda' }}</h2><p>{{ $purchase->purchased_at->format('d/m/Y H:i') }}</p></div>
            <dl class="purchase-invoice__meta"><div><dt>Referencia</dt><dd>{{ $purchase->ticket_reference ?: 'Sin referencia' }}</dd></div><div><dt>Medio de pago</dt><dd>{{ $purchase->payment_method ?: 'Sin registrar' }}</dd></div></dl>
            <button type="button" class="md-btn-text" wire:click="$dispatch('open-purchase-editor', { purchaseId: '{{ $purchase->id }}' })"><i class="bi bi-pencil" aria-hidden="true"></i> Editar compra</button>
        </header>
        <div class="purchase-invoice__table" role="region" aria-label="Ítems de la compra" tabindex="0">
            <table class="md-table"><caption class="visually-hidden">Ingredientes, presentación, cantidad de paquetes, precio por paquete y subtotal en pesos colombianos</caption>
                <thead><tr><th scope="col">Ingrediente</th><th scope="col">Presentación</th><th scope="col">Cantidad</th><th scope="col">Precio por paquete</th><th scope="col">Subtotal</th></tr></thead>
                <tbody>@foreach ($purchase->lines as $line)
                    <tr wire:key="invoice-line-{{ $line->id }}"><th scope="row">
                        @if (in_array($line->shopping_item_id, $ingredientIds, true))<a href="{{ route('meals.ingredients', ['ingredient' => $line->shopping_item_id]) }}" wire:navigate>{{ $line->product_name }} <i class="bi bi-arrow-up-right" aria-hidden="true"></i></a>@else{{ $line->product_name }}@endif
                        <small>Stock añadido: {{ number_format($line->stock_added, 3, ',', '.') }} {{ $line->base_unit }}</small>
                        @if ($line->ticket_text)<small>{{ $line->ticket_text }}</small>@endif
                    </th><td>{{ $line->variant_label ?: 'Sin presentación' }}</td><td>{{ rtrim(rtrim(number_format($line->packages, 3, ',', '.'), '0'), ',') }} {{ $line->packages == 1 ? 'paquete' : 'paquetes' }}</td><td>{{ $line->unit_price === null ? 'Sin registrar' : '$ '.number_format((float) $line->unit_price, 2, ',', '.') }}</td><td>{{ $line->unit_price === null ? 'Sin registrar' : '$ '.number_format(round((float) $line->unit_price * $line->packages, 2), 2, ',', '.') }}</td></tr>
                @endforeach</tbody>
                <tfoot><tr><th scope="row" colspan="4">Suma de ítems{{ $summary['lines_total_complete'] ? '' : ' (incompleta)' }}</th><td>$ {{ number_format($summary['lines_total'], 2, ',', '.') }}</td></tr><tr><th scope="row" colspan="4">Total pagado</th><td>{{ $purchase->total_paid === null ? 'Sin registrar' : '$ '.number_format((float) $purchase->total_paid, 2, ',', '.') }}</td></tr></tfoot>
            </table>
        </div>
        <footer class="purchase-invoice__footer"><p>Valores en COP.</p>@if ($purchase->notes)<h3 class="md-title-small">Notas</h3><p class="purchase-invoice__notes">{{ $purchase->notes }}</p>@endif</footer>
    </article>
    <livewire:meal.purchase-editor :key="'purchase-editor-detail-'.$purchase->id" />
</x-module-shell>
