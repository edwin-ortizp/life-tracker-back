<div>
    @if ($open)
        <div x-data="{ open: true }">
            <x-ui.dialog state="open" title="Tiendas" icon="bi-shop" size="lg" x-on:md-surface-close="$wire.close()">
                <p class="md-body-small">Los precios solo se registran en tiendas de este catálogo. Así «Exito» y «Éxito» no terminan siendo dos tiendas.</p>

                <div class="store-catalog__new">
                    <x-ui.field name="newName" label="Nueva tienda" wire:model.live.debounce.300ms="newName" wire:keydown.enter="create" />
                    <x-ui.action variant="filled" icon="bi-plus-lg" wire:click="create">{{ $confirmSimilar ? 'Crear de todos modos' : 'Crear' }}</x-ui.action>
                </div>

                @if ($stores->isNotEmpty())
                    <x-ui.list label="Tiendas del catálogo">
                        @foreach ($stores as $store)
                            <x-ui.list-item :headline="$store->name"
                                            :supporting="$store->prices_count.' '.($store->prices_count === 1 ? 'precio' : 'precios')"
                                            wire:key="store-{{ $store->id }}">
                                <x-slot:trailing>
                                    <x-ui.icon-action icon="bi-pencil" label="Renombrar {{ $store->name }}" wire:click="startRename('{{ $store->id }}')" />
                                    @if ($stores->count() > 1)
                                        <x-ui.icon-action icon="bi-intersect" label="Unir {{ $store->name }} con otra tienda" wire:click="startMerge('{{ $store->id }}')" />
                                    @endif
                                    @if ($store->prices_count === 0)
                                        <x-ui.destructive-action label="Eliminar {{ $store->name }}" :iconOnly="true"
                                                                 action="delete('{{ $store->id }}')" title="Eliminar tienda"
                                                                 message="La tienda «{{ $store->name }}» se elimina del catálogo." />
                                    @endif
                                </x-slot:trailing>
                            </x-ui.list-item>

                            @if ($editingId === $store->id)
                                <div class="store-catalog__inline" wire:key="store-rename-{{ $store->id }}">
                                    <x-ui.field name="editingName" label="Nuevo nombre" wire:model="editingName" wire:keydown.enter="rename" />
                                    <x-ui.action variant="filled" wire:click="rename">Guardar</x-ui.action>
                                    <x-ui.action variant="text" wire:click="$set('editingId', null)">Cancelar</x-ui.action>
                                </div>
                            @endif

                            @if ($mergingId === $store->id)
                                <div class="store-catalog__inline" wire:key="store-merge-{{ $store->id }}">
                                    <x-ui.select name="mergeTargetId" label="Unir con" placeholder="Elige la tienda que se conserva"
                                                 :options="$stores->where('id', '!=', $store->id)->pluck('name', 'id')->all()"
                                                 :selected="$mergeTargetId" wire:model="mergeTargetId"
                                                 help="Sus {{ $store->prices_count }} precios pasan a la tienda elegida y «{{ $store->name }}» desaparece." />
                                    <x-ui.action variant="filled" wire:click="merge">Unir</x-ui.action>
                                    <x-ui.action variant="text" wire:click="$set('mergingId', null)">Cancelar</x-ui.action>
                                </div>
                            @endif
                        @endforeach
                    </x-ui.list>
                @else
                    <x-ui.state variant="empty" icon="bi-shop" title="Aún no tienes tiendas" message="Crea la primera para poder registrar precios." />
                @endif

                <x-slot:actions>
                    <x-ui.action variant="text" wire:click="close">Cerrar</x-ui.action>
                </x-slot:actions>
            </x-ui.dialog>
        </div>
    @endif
</div>
