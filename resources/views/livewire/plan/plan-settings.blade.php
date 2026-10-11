<x-module-shell module="plans" archetype="settings">
    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Nueva etiqueta', 'icon' => 'bi-plus-lg', 'action' => 'openForm']" />
    </x-slot:actions>

    @if ($message)
        <div class="md-card-filled mb-3 py-3" role="status" aria-live="polite">{{ $message }}</div>
    @endif

    <x-ui.section title="Etiquetas de planes" :level="2"
                  description="Crea etiquetas reutilizables para clasificar tus planes, como tipos de comida o intereses.">
        @if ($tags->isEmpty())
            <x-ui.state variant="empty" icon="bi-tags" title="Aún no tienes etiquetas"
                        message="Crea una etiqueta y podrás asociarla a varios planes." />
        @else
            <x-ui.list label="Etiquetas de planes">
                @foreach ($tags as $tag)
                    <x-ui.list-item :headline="$tag->name" :supporting="$tag->plans_count.' '.($tag->plans_count === 1 ? 'plan asociado' : 'planes asociados')" wire:key="plan-tag-{{ $tag->id }}">
                        <x-slot:leading>
                            <span class="md-list-icon-circle" aria-hidden="true"><i class="bi {{ $tag->icon }}"></i></span>
                        </x-slot:leading>
                        <x-slot:trailing>
                            <x-ui.row-actions :label="'Más acciones de '.$tag->name">
                                <x-slot:primary wire:click="openForm('{{ $tag->id }}')">Editar</x-slot:primary>
                                @if ($tag->plans_count > 0)
                                    <x-ui.menu-item icon="bi-trash" tone="danger" wire:click="delete('{{ $tag->id }}')">Eliminar</x-ui.menu-item>
                                @else
                                    <x-ui.menu-item icon="bi-trash" tone="danger" wire:click="delete('{{ $tag->id }}')" wire:confirm="¿Eliminar la etiqueta «{{ $tag->name }}»?">Eliminar</x-ui.menu-item>
                                @endif
                            </x-ui.row-actions>
                        </x-slot:trailing>
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
        @endif
    </x-ui.section>

    <x-ui.form-dialog :open="$showForm" close="closeForm" submit-action="save" id="plan-tag-dialog"
                      :title="$editingId ? 'Editar etiqueta' : 'Nueva etiqueta'" icon="bi-tags"
                      :submit="$editingId ? 'Actualizar' : 'Crear etiqueta'">
        <div class="d-flex flex-column gap-3">
            <x-ui.field name="name" label="Nombre" :required="true" maxlength="60" wire:model="name" />
            <x-ui.select name="icon" label="Icono" :selected="$icon" :options="$icons" :icon="$icon" wire:model.live="icon" />
        </div>
    </x-ui.form-dialog>
</x-module-shell>
