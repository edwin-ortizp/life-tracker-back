<div>
    <x-ui.form-dialog :open="$show" close="close" submit-action="save" id="purchase-editor-dialog"
                      :title="$purchaseId ? 'Editar compra' : 'Registrar compra'" icon="bi-receipt"
                      :sections="['basic' => ['label' => 'Compra', 'icon' => 'bi-receipt'], 'lines' => ['label' => 'Productos', 'icon' => 'bi-basket'], 'details' => ['label' => 'Detalles', 'icon' => 'bi-card-text']]">
        @if ($show)
            @if ($errors->any())
                <div role="alert" class="md-supporting-text">
                    @foreach ($errors->all() as $message)<p>{{ $message }}</p>@endforeach
                </div>
            @endif
            <x-ui.form-dialog-section name="basic" title="Compra">
                <div class="d-flex flex-column gap-3">
                    <x-ui.field name="form.purchased_at" label="Fecha y hora" type="datetime-local" wire:model="form.purchased_at" required />
                    <x-ui.select name="form.store_id" label="Tienda" :options="$stores" :selected="$form['store_id']" placeholder="Seleccionar tienda" wire:model="form.store_id" :required="! $purchaseId" />
                    <x-ui.field name="form.total_paid" label="Total pagado" type="number" min="0" step="0.01" wire:model="form.total_paid" help="Opcional. Puede diferir de la suma de productos." />
                </div>
            </x-ui.form-dialog-section>
            <x-ui.form-dialog-section name="lines" title="Productos">
                <div class="d-flex flex-column gap-3">
                    @foreach ($form['lines'] as $index => $line)
                        @php $product = $products->firstWhere('id', $line['shopping_item_id']); @endphp
                        <fieldset wire:key="purchase-line-{{ $line['id'] ?? $line['_key'] ?? $operationKey.'-'.$index }}" class="border rounded p-3">
                            <legend class="md-label-large">Producto {{ $index + 1 }}</legend>
                            <div class="d-flex flex-column gap-3">
                                <x-ui.select :name="'form.lines.'.$index.'.shopping_item_id'" label="Producto" :options="$products->pluck('name', 'id')" :selected="$line['shopping_item_id']" placeholder="Seleccionar producto" wire:model.live="form.lines.{{ $index }}.shopping_item_id" required />
                                <x-ui.select :name="'form.lines.'.$index.'.shopping_item_variant_id'" label="Presentación" :options="$product?->variants->mapWithKeys(fn ($variant) => [$variant->id => $variant->label($product->base_unit)]) ?? []" :selected="$line['shopping_item_variant_id']" placeholder="Sin presentación" wire:model="form.lines.{{ $index }}.shopping_item_variant_id" />
                                <div class="md-field-pair">
                                    <x-ui.field :name="'form.lines.'.$index.'.packages'" label="Paquetes" type="number" min="0.000001" step="any" wire:model.live.debounce.300ms="form.lines.{{ $index }}.packages" required />
                                    <x-ui.field :name="'form.lines.'.$index.'.unit_price'" label="Precio final por paquete" type="number" min="0" step="0.01" wire:model.live.debounce.300ms="form.lines.{{ $index }}.unit_price" />
                                </div>
                                <x-ui.field :name="'form.lines.'.$index.'.ticket_text'" label="Texto del ticket" wire:model="form.lines.{{ $index }}.ticket_text" />
                                <p class="md-body-medium">Subtotal: {{ is_numeric($line['unit_price']) && is_numeric($line['packages']) ? '$'.number_format((float) $line['unit_price'] * (float) $line['packages'], 2, ',', '.') : 'Sin precio' }}</p>
                                <button type="button" class="md-btn-text" wire:click="removeLine({{ $index }})" aria-label="Quitar producto {{ $index + 1 }}">Quitar línea</button>
                            </div>
                        </fieldset>
                    @endforeach
                    <button type="button" class="md-btn-text" wire:click="addLine">Añadir línea</button>
                    @php
                        $complete = collect($form['lines'])->every(fn ($line) => is_numeric($line['unit_price']));
                        $sum = collect($form['lines'])->sum(fn ($line) => is_numeric($line['unit_price']) && is_numeric($line['packages']) ? (float) $line['unit_price'] * (float) $line['packages'] : 0);
                    @endphp
                    <p role="status" class="md-body-medium">Suma de líneas: ${{ number_format($sum, 2, ',', '.') }}{{ $complete ? '' : ' (incompleta: faltan precios)' }}</p>
                </div>
            </x-ui.form-dialog-section>
            <x-ui.form-dialog-section name="details" title="Detalles">
                <div class="d-flex flex-column gap-3">
                    <x-ui.field name="form.payment_method" label="Medio de pago" wire:model="form.payment_method" />
                    <x-ui.field name="form.ticket_reference" label="Referencia del ticket" wire:model="form.ticket_reference" />
                    <x-ui.textarea name="form.notes" label="Notas" wire:model="form.notes" />
                </div>
            </x-ui.form-dialog-section>
        @endif
    </x-ui.form-dialog>
</div>
