<x-ui.section title="Estados" :level="2"
              description="Ponles el nombre que quieras. El tipo define su comportamiento: puedes tener varios estados por hacer, listos o en curso, y un único estado terminado, que es el que completa la tarea.">
    @foreach ($statusGroups as $type => $group)
        <div class="task-status-group" wire:key="task-status-group-{{ $type }}">
            <h3 class="md-title-small task-status-group__title">
                <i class="bi {{ $group['icon'] }}" aria-hidden="true"></i> {{ $group['label'] }}
            </h3>
            <x-ui.list :label="'Estados de tipo '.$group['label']">
                @foreach ($group['statuses'] as $status)
                    @php
                        $total = (int) ($statusCounts[$status->id] ?? 0);
                        $usage = $total ? $total.' '.($total === 1 ? 'tarea' : 'tareas') : 'Sin tareas';
                        $locked = $type === \App\Models\TaskStatus::DONE
                            || ($type === \App\Models\TaskStatus::TODO && $group['statuses']->count() === 1);
                    @endphp
                    <x-ui.list-item :headline="$status->name" :supporting="$usage" wire:key="task-status-{{ $status->id }}">
                        <x-slot:leading>
                            <span class="md-list-icon-circle" aria-hidden="true"><i class="bi {{ $status->icon }}"></i></span>
                        </x-slot:leading>
                        <x-slot:trailing>
                            <x-ui.row-actions :label="'Más acciones de '.$status->name">
                                <x-slot:primary wire:click="openStatusForm('{{ $status->id }}')">Editar</x-slot:primary>
                                @unless ($loop->first)
                                    <x-ui.menu-item icon="bi-arrow-up" wire:click="moveStatus('{{ $status->id }}', -1)">Subir</x-ui.menu-item>
                                @endunless
                                @unless ($loop->last)
                                    <x-ui.menu-item icon="bi-arrow-down" wire:click="moveStatus('{{ $status->id }}', 1)">Bajar</x-ui.menu-item>
                                @endunless
                                @unless ($locked)
                                    <x-ui.menu-divider />
                                    @if ($total)
                                        <x-ui.menu-item icon="bi-trash" tone="danger" wire:click="deleteStatus('{{ $status->id }}')">Eliminar</x-ui.menu-item>
                                    @else
                                        <x-ui.menu-item icon="bi-trash" tone="danger" wire:click="deleteStatus('{{ $status->id }}')"
                                                        wire:confirm="“{{ $status->name }}” no tiene tareas; se eliminará de tus estados.">Eliminar</x-ui.menu-item>
                                    @endif
                                @endunless
                            </x-ui.row-actions>
                        </x-slot:trailing>
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
            @if ($group['statuses']->isEmpty())
                <p class="md-body-small mb-0">Aún no tienes estados de este tipo.</p>
            @endif
        </div>
    @endforeach
</x-ui.section>

<x-ui.form-dialog :open="$showStatusForm" close="closeStatusForm" submit-action="saveStatus" id="task-status-dialog"
                  :title="$editingStatusId ? 'Editar estado' : 'Nuevo estado'" icon="bi-kanban"
                  :submit="$editingStatusId ? 'Actualizar' : 'Crear estado'">
    <div class="d-flex flex-column gap-3">
        <x-ui.field name="statusName" label="Nombre" :required="true" maxlength="60" wire:model="statusName" />
        @if ($editingStatus && $editingStatus->type === \App\Models\TaskStatus::DONE)
            <p class="md-body-small mb-0">Tipo: {{ $statusTypes[\App\Models\TaskStatus::DONE] }}. Es el único estado terminado y no cambia de tipo.</p>
        @else
            <x-ui.select name="statusType" label="Tipo" :selected="$statusType" :options="$editableStatusTypes" wire:model="statusType" />
        @endif
    </div>
</x-ui.form-dialog>

<x-ui.form-dialog :open="(bool) $deletingStatus" close="cancelStatusDelete" submit-action="reassignAndDeleteStatus" id="task-status-delete-dialog"
                  :title="$deletingStatus ? 'Eliminar «'.$deletingStatus->name.'»' : 'Eliminar estado'" icon="bi-exclamation-triangle"
                  submit="Eliminar estado">
    @if ($deletingStatus)
        <div class="d-flex flex-column gap-3">
            <p class="md-body-medium mb-0">
                Hay {{ $deletingStatusCount }} {{ $deletingStatusCount === 1 ? 'tarea' : 'tareas' }} en este estado.
                Elige a cuál pasarlas.
            </p>
            <x-ui.select name="statusReassignTo" label="Pasar tareas a" placeholder="Elige un estado"
                         :selected="$statusReassignTo" :options="$statusReassignOptions" wire:model="statusReassignTo" />
        </div>
    @endif
</x-ui.form-dialog>
