<x-module-shell module="tasks" archetype="settings">
    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Nueva categoría', 'icon' => 'bi-plus-lg', 'action' => 'openForm']" />
    </x-slot:actions>

    @if ($message)
        <div class="md-card-filled mb-3 py-3" role="status" aria-live="polite">{{ $message }}</div>
    @endif

    <x-ui.section title="Categorías" :level="2"
                  description="Ordénalas como quieras verlas en la lista, el flujo y los formularios. Renombrar no cambia tus tareas.">
        <x-slot:actions>
            <x-ui.action variant="text" icon="bi-arrow-counterclockwise" wire:click="restoreDefaults">Restaurar predeterminadas</x-ui.action>
        </x-slot:actions>

        @if ($categoryList->isEmpty())
            <x-ui.state variant="empty" icon="bi-tags" title="Aún no tienes categorías"
                        message="Agrega las predeterminadas o crea la tuya para clasificar tus tareas.">
                <x-slot:actions>
                    <x-ui.action variant="filled" icon="bi-arrow-counterclockwise" wire:click="restoreDefaults">Agregar predeterminadas</x-ui.action>
                </x-slot:actions>
            </x-ui.state>
        @else
            <x-ui.list label="Categorías de tareas">
                @foreach ($categoryList as $category)
                    @php
                        $row = $counts[$category->key] ?? null;
                        $usage = $row
                            ? (int) $row->pending.' '.((int) $row->pending === 1 ? 'pendiente' : 'pendientes').' · '.(int) $row->total.' en total'
                            : 'Sin tareas';
                    @endphp
                    <x-ui.list-item :headline="$category->name" :supporting="$usage" wire:key="task-category-{{ $category->id }}">
                        <x-slot:leading>
                            <span class="md-list-icon-circle" aria-hidden="true"><i class="bi {{ $category->icon ?: 'bi-tag' }}"></i></span>
                        </x-slot:leading>
                        <x-slot:trailing>
                            <x-ui.row-actions :label="'Más acciones de '.$category->name">
                                <x-slot:primary wire:click="openForm('{{ $category->id }}')">Editar</x-slot:primary>
                                @unless ($loop->first)
                                    <x-ui.menu-item icon="bi-arrow-up" wire:click="move('{{ $category->id }}', -1)">Subir</x-ui.menu-item>
                                @endunless
                                @unless ($loop->last)
                                    <x-ui.menu-item icon="bi-arrow-down" wire:click="move('{{ $category->id }}', 1)">Bajar</x-ui.menu-item>
                                @endunless
                                <x-ui.menu-divider />
                                @if ($row)
                                    <x-ui.menu-item icon="bi-trash" tone="danger" wire:click="delete('{{ $category->id }}')">Eliminar</x-ui.menu-item>
                                @else
                                    <x-ui.menu-item icon="bi-trash" tone="danger" wire:click="delete('{{ $category->id }}')"
                                                    wire:confirm="“{{ $category->name }}” no tiene tareas; se eliminará de tu catálogo.">Eliminar</x-ui.menu-item>
                                @endif
                            </x-ui.row-actions>
                        </x-slot:trailing>
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
        @endif

        @if ($uncategorized)
            <p class="md-body-small mt-3 mb-0">
                {{ (int) $uncategorized->pending }} {{ (int) $uncategorized->pending === 1 ? 'tarea pendiente' : 'tareas pendientes' }} sin categoría.
            </p>
        @endif
    </x-ui.section>

    <x-ui.form-dialog :open="$showForm" close="closeForm" submit-action="save" id="task-category-dialog"
                      :title="$editingId ? 'Editar categoría' : 'Nueva categoría'" icon="bi-tags"
                      :submit="$editingId ? 'Actualizar' : 'Crear categoría'">
        <div class="d-flex flex-column gap-3">
            <x-ui.field name="name" label="Nombre" :required="true" maxlength="60" wire:model="name" />
            <x-ui.select name="icon" label="Icono" :selected="$icon" :options="$icons" :icon="$icon" wire:model.live="icon" />
        </div>
    </x-ui.form-dialog>

    <x-ui.form-dialog :open="(bool) $deleting" close="cancelDelete" submit-action="reassignAndDelete" id="task-category-delete-dialog"
                      :title="$deleting ? 'Eliminar «'.$deleting->name.'»' : 'Eliminar categoría'" icon="bi-exclamation-triangle"
                      submit="Eliminar categoría">
        @if ($deleting)
            <div class="d-flex flex-column gap-3">
                <p class="md-body-medium mb-0">
                    Hay {{ $deletingCount }} {{ $deletingCount === 1 ? 'tarea' : 'tareas' }} con esta categoría.
                    Elige a cuál pasarlas o déjalas sin categoría.
                </p>
                <x-ui.select name="reassignTo" label="Pasar tareas a" placeholder="Sin categoría"
                             :selected="$reassignTo" :options="$reassignOptions" wire:model="reassignTo" />
            </div>
        @endif
    </x-ui.form-dialog>
</x-module-shell>
