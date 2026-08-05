<x-catalog.example title="Riesgo material" description="Eliminar un registro persistente pide confirmación antes de ejecutarse.">
    <x-ui.destructive-action label="Eliminar tarea" action="deleteTask"
                             message="La tarea y su historial de progreso se eliminan de forma permanente." />
    <x-ui.destructive-action label="Eliminar tarea" action="deleteTask" :iconOnly="true"
                             message="La tarea y su historial de progreso se eliminan de forma permanente." />
</x-catalog.example>

<x-catalog.example title="Riesgo reversible" description="Una acción que se puede deshacer se ejecuta directamente, con el mismo tono.">
    <x-ui.destructive-action label="Quitar etiqueta" action="detachTag" risk="reversible" icon="bi-x-lg" variant="text" />
    <x-ui.destructive-action label="Quitar del plan" action="detachPlan" risk="reversible" icon="bi-x-lg" variant="outlined" />
</x-catalog.example>
