<div x-data="ltFormEditor($wire, @js($defaults), {openForm:'showForm'})" @task-editor.window="openEditor($event.detail)"
     x-effect="if (!$wire.showForm && $wire.$parent.editTask) $wire.$parent.$set('editTask', null, false)">
    @teleport('body')
    <div :class="{'lt-editor-pristine': !submitted}">
        <div>
            @include('livewire.task.partials.edit-task-dialog', ['dialogId' => 'task-editor', 'dialogTitle' => $editingId ? 'Editar tarea' : 'Nueva tarea', 'saveLabel' => 'Guardar', 'showRecurrenceFields' => true, 'localEditor' => true])
        </div>
    </div>
    @endteleport
</div>
