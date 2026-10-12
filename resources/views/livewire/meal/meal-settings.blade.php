<x-module-shell module="meals" title="Ajustes de Comidas" archetype="settings">
    <x-slot:actions>
        <x-module-actions :primary="['label' => $section === 'stores' ? 'Crear tienda' : 'Crear categoría', 'icon' => 'bi-plus-lg', 'action' => 'openForm']" />
    </x-slot:actions>
    @if ($message)<div class="md-card-filled mb-3 py-3" role="status" aria-live="polite">{{ $message }}</div>@endif
    <div class="meal-settings-workspace">
        <div>
            <x-ui.management-card id="meal-settings-catalog" :title="$section === 'stores' ? 'Tiendas' : 'Categorías de productos'" :icon="$section === 'stores' ? 'bi-shop' : 'bi-tags'"
                                  :count="'('.$records->total().')'" search="search" :search-placeholder="$section === 'stores' ? 'Buscar tiendas' : 'Buscar categorías'" :paginator="$records" :noun="$section === 'stores' ? 'tiendas' : 'categorías'">
                @if ($records->isEmpty())
                    <x-ui.state variant="empty" :icon="$section === 'stores' ? 'bi-shop' : 'bi-tags'" title="No hay resultados" message="Prueba otra búsqueda o crea un registro desde el botón flotante." />
                @else
                    <x-ui.list :label="$section === 'stores' ? 'Tiendas del catálogo' : 'Categorías del catálogo'">
                        @foreach ($records as $record)
                            <x-ui.list-item :headline="$record->name" :supporting="$section === 'stores' ? $record->prices_count.' precios · '.$record->purchases_count.' compras' : ($categoryCounts[$record->id] ?? 0).' ingredientes'" wire:key="meal-setting-{{ $record->id }}">
                                <x-slot:trailing>
                                    <x-ui.row-actions :label="'Acciones de '.$record->name">
                                        <x-slot:primary wire:click="openForm('{{ $record->id }}')">Editar</x-slot:primary>
                                        @if ($section === 'stores')<x-ui.menu-item icon="bi-intersect" wire:click="openMerge('{{ $record->id }}')">Fusionar con otra tienda</x-ui.menu-item>@endif
                                        <x-ui.menu-item icon="bi-trash" tone="danger" wire:click="delete('{{ $record->id }}')" wire:confirm="¿Eliminar «{{ $record->name }}»?">Eliminar</x-ui.menu-item>
                                    </x-ui.row-actions>
                                </x-slot:trailing>
                            </x-ui.list-item>
                        @endforeach
                    </x-ui.list>
                @endif
            </x-ui.management-card>
        </div>
        <nav class="meal-settings-nav" aria-label="Secciones de Ajustes de Comidas">
            <a href="{{ route('meals.settings') }}" wire:navigate class="meal-settings-nav__item {{ $section === 'stores' ? 'is-active' : '' }}" @if ($section === 'stores') aria-current="page" @endif><i class="bi bi-shop" aria-hidden="true"></i> Tiendas</a>
            <a href="{{ route('meals.settings.categories') }}" wire:navigate class="meal-settings-nav__item {{ $section === 'categories' ? 'is-active' : '' }}" @if ($section === 'categories') aria-current="page" @endif><i class="bi bi-tags" aria-hidden="true"></i> Categorías de productos</a>
        </nav>
    </div>
    <x-ui.form-dialog :open="$showForm" close="closeForm" submit-action="save" id="meal-settings-form" :title="($editingId ? 'Editar ' : 'Crear ').($section === 'stores' ? 'tienda' : 'categoría')" :icon="$section === 'stores' ? 'bi-shop' : 'bi-tags'" :submit="$confirmSimilar ? 'Crear de todos modos' : 'Guardar'">
        <x-ui.field name="name" label="Nombre" :required="true" maxlength="255" wire:model.live.debounce.300ms="name" />
    </x-ui.form-dialog>
    <x-ui.form-dialog :open="$showMerge" close="closeMerge" submit-action="merge" id="meal-store-merge" title="Fusionar tiendas" icon="bi-intersect" submit="Fusionar">
        <p>Los precios, compras y marcas de la tienda de origen pasarán a la tienda elegida. La tienda de origen se eliminará.</p>
        <x-ui.select name="mergeTargetId" label="Tienda que se conserva" placeholder="Selecciona una tienda" :required="true" :options="$storeOptions" :selected="$mergeTargetId" wire:model="mergeTargetId" />
    </x-ui.form-dialog>
</x-module-shell>
