<x-module-shell :module="$module" :title="'Categorías · '.$label" archetype="settings">
    <x-slot:actions><x-ui.fab label="Crear categoría" icon="bi-plus-lg" action="openForm" :module="$module" /></x-slot:actions>
    <nav aria-label="Catálogos de categorías">
        @foreach (\App\Support\CategoryCatalog::DOMAINS as $key => $definition)
            @if ($definition[2] === $module)
                <x-ui.action variant="text" :href="route('categories.settings', $key)" :aria-current="$key === $domain ? 'page' : null">{{ $definition[1] }}</x-ui.action>
            @endif
        @endforeach
    </nav>
    @if ($message)<p role="status">{{ $message }}</p>@endif
    <x-ui.management-card id="category-catalog" :title="'Categorías · '.$label" icon="bi-diagram-3" search="search" search-placeholder="Buscar categorías">
        <table class="md-table md-table--stack" aria-label="Categorías">
            <thead><tr><th scope="col">Nombre</th><th scope="col">Categoría padre</th><th scope="col" class="md-table__actions">Acciones</th></tr></thead>
            <tbody>@forelse ($records as $record)
                <tr wire:key="category-{{ $record->id }}">
                    <td data-label="Nombre">@if($record->parent_id)<span aria-hidden="true">↳ </span>@endif{{ $record->name }}</td>
                    <td data-label="Categoría padre">{{ $record->parent?->name ?? 'Sin padre' }}</td>
                    <td data-label="Acciones" class="md-table__actions"><x-ui.row-actions :label="'Acciones de '.$record->name"><x-slot:primary wire:click="openForm('{{ $record->id }}')">Editar</x-slot:primary><x-ui.menu-item icon="bi-trash" tone="danger" wire:click="delete('{{ $record->id }}')" wire:confirm="¿Eliminar esta categoría?">Eliminar</x-ui.menu-item></x-ui.row-actions></td>
                </tr>
            @empty<tr><td colspan="3">No hay categorías.</td></tr>@endforelse</tbody>
        </table>
    </x-ui.management-card>
    <x-ui.form-dialog :module="$module" :open="$showForm" close="closeForm" submit-action="save" id="category-form" :title="$editingId ? 'Editar categoría' : 'Crear categoría'" icon="bi-diagram-3">
        <x-ui.field name="name" label="Nombre" wire:model="name" :required="true" maxlength="100" />
        <x-ui.category-select name="parent_id" label="Categoría padre" placeholder="Sin padre" :options="$parents" wire:model="parent_id" />
        <p class="md-body-small">Solo se permiten categorías padre e hijas.</p>
    </x-ui.form-dialog>
</x-module-shell>
