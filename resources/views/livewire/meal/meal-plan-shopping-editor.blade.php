<div>
    <x-ui.form-dialog :open="$showForm" title="Generar compras del plan" icon="bi-cart-plus" close="closeForm" submit-action="save" submit="Agregar faltantes" id="meal-plan-shopping" module="meals">
        @if ($errors->any())<div role="alert">@foreach ($errors->all() as $message)<p>{{ $message }}</p>@endforeach</div>@endif
        <x-ui.field label="Desde" name="since" type="date" wire:model.live="since" />
        <x-ui.field label="Hasta" name="until" type="date" wire:model.live="until" />
        <p>Se conservan las compras manuales. Repetir esta acción no acumula paquetes. Las comidas consumidas y preparaciones cocinadas no vuelven a pedir ingredientes.</p>
        @foreach ($preview['warnings'] as $warning)<p role="status">{{ $warning }}</p>@endforeach
        @forelse ($preview['needs'] as $row)
            <section class="md-form-section mb-3" wire:key="plan-shopping-{{ $row['shopping_item_id'] }}">
                <h3 class="md-title-small">{{ $row['name'] }}</h3>
                <p>Necesarios: {{ $row['quantity'] ?? 'Datos incompletos' }} {{ $row['unit'] }} · stock: {{ $row['stock'] }} · faltan: {{ $row['missing'] ?? '?' }}</p>
                @if ($row['missing'] > 0)
                    <x-ui.select label="Presentación de {{ $row['name'] }}" wire:model="variants.{{ $row['shopping_item_id'] }}" placeholder="Usar preferida comparable">
                        @foreach ($products->get($row['shopping_item_id'])?->variants ?? [] as $variant)
                            @if ($variant->isComparable())<option value="{{ $variant->id }}">{{ $variant->label($row['unit']) }}</option>@endif
                        @endforeach
                    </x-ui.select>
                    <p>{{ $row['packages'] === null ? 'Selecciona una presentación si no hay preferida.' : $row['packages'].' paquetes con la presentación preferida.' }}</p>
                @endif
            </section>
        @empty<p>No hay ingredientes pendientes en este intervalo.</p>@endforelse
    </x-ui.form-dialog>
</div>
