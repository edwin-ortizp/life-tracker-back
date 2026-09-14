{{-- Formulario de tarea asociada a una persona. Requiere ManagesRelationshipTasks. --}}
<x-ui.form-dialog :open="$showTaskForm" close="$set('showTaskForm', false)" submit-action="saveTask"
                  title="Agregar tarea asociada" icon="bi-check2-square" id="relationship-task-dialog">
    <div class="d-flex flex-column gap-3">
        <x-ui.field name="taskTitle" label="Título" :required="true" wire:model="taskTitle" />
        <x-ui.textarea name="taskDescription" label="Descripción" rows="3" wire:model="taskDescription" />
        <div class="md-field-pair">
            <x-ui.select name="taskPriority" label="Prioridad" placeholder="Sin prioridad" :options="$priorities" :selected="$taskPriority" wire:model="taskPriority" />
            <x-ui.field name="taskDueDate" label="Vencimiento" type="date" wire:model="taskDueDate" />
        </div>
        <label class="md-relationship-sensitive">
            <input type="checkbox" wire:model="taskIsPrivate" id="task-private">
            <span class="md-body-small">Tarea privada</span>
        </label>
    </div>
</x-ui.form-dialog>
