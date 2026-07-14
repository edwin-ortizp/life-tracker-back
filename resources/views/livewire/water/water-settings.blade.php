<x-module-shell module="water">
    @if ($message)<div class="md-card-filled mb-3 py-3">{{ $message }}</div>@endif
    <div class="md-module-workspace">
        <div class="md-module-primary">
            <section class="md-card-elevated mb-3">
                <h2 class="md-title-medium mb-1">Meta diaria</h2><p class="md-body-small mb-3">Si queda vacía, se calculará con tu peso registrado.</p>
                <form wire:submit="saveGoal" class="d-flex align-items-start gap-2 flex-wrap"><div class="md-text-field" style="min-width:220px"><input wire:model="dailyWaterGoal" type="number" min="500" max="10000" id="water-goal" placeholder=" "><label for="water-goal">Meta personalizada (ml)</label></div><button class="md-btn-filled">Guardar meta</button></form>
                @error('dailyWaterGoal')<small style="color:var(--md-sys-color-error)">{{ $message }}</small>@enderror
            </section>
            <section class="md-card-elevated p-0 overflow-hidden">
                <div class="p-3 d-flex align-items-center justify-content-between"><h2 class="md-title-medium mb-0">Catálogo de bebidas</h2><button wire:click="edit" class="md-btn-tonal"><i class="bi bi-plus-lg"></i> Nueva</button></div>
                @foreach ($drinkTypes as $type)<div class="md-list-item"><div class="md-list-item-leading" style="font-size:1.4rem">{{ $type->icon ?: '💧' }}</div><div class="md-list-item-content"><div class="md-list-item-headline">{{ $type->name }}</div><div class="md-list-item-supporting">Factor {{ $type->hydration_factor }}</div></div><div class="md-list-item-trailing"><button wire:click="edit('{{ $type->id }}')" class="md-btn-icon" aria-label="Editar {{ $type->name }}"><i class="bi bi-pencil"></i></button><button wire:click="deleteDrinkType('{{ $type->id }}')" wire:confirm="¿Eliminar esta bebida?" class="md-btn-icon" aria-label="Eliminar {{ $type->name }}"><i class="bi bi-trash"></i></button></div></div>@endforeach
            </section>
        </div>
        <aside class="md-context-rail">
            <x-context-widget title="{{ $editingId ? 'Editar bebida' : 'Nueva bebida' }}" icon="bi-cup-straw">
                <form wire:submit="saveDrinkType" class="d-grid gap-3"><div><label class="form-label" for="drink-name">Nombre</label><input wire:model="name" id="drink-name" class="form-control">@error('name')<small class="text-danger">{{ $message }}</small>@enderror</div><div><label class="form-label" for="drink-icon">Icono</label><input wire:model="icon" id="drink-icon" class="form-control">@error('icon')<small class="text-danger">{{ $message }}</small>@enderror</div><div><label class="form-label" for="drink-factor">Factor</label><input wire:model="hydrationFactor" id="drink-factor" type="number" min="0" max="9.99" step=".01" class="form-control">@error('hydrationFactor')<small class="text-danger">{{ $message }}</small>@enderror</div><button class="md-btn-filled">Guardar bebida</button></form>
            </x-context-widget>
        </aside>
    </div>
</x-module-shell>
