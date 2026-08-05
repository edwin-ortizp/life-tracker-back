<x-layouts.catalog-screen title="Arquetipo de detalle">
    <x-module-shell module="tasks" title="Preparar la compra semanal" subtitle="Comidas · vence hoy" archetype="detail">
        <x-slot:actions>
            <x-ui.action variant="outlined" icon="bi-clock-history">Posponer</x-ui.action>
            <x-ui.action variant="filled" icon="bi-check2">Completar</x-ui.action>
        </x-slot:actions>

        <x-slot:rail>
            <x-context-widget title="Contexto" icon="bi-signpost-split">
                <x-ui.metric label="Sesiones dedicadas" value="3" support="Última hace dos días" />
            </x-context-widget>
        </x-slot:rail>

        <x-ui.section title="Resumen">
            <x-ui.metric-grid label="Resumen de la tarea">
                <x-ui.metric label="Avance" value="60" unit="%" tone="primary">
                    <x-ui.progress :value="60" tone="primary" />
                </x-ui.metric>
                <x-ui.metric label="Subtareas" value="3" support="De 5 previstas" />
                <x-ui.metric label="Última revisión" :value="null" support="Sin registros todavía" />
            </x-ui.metric-grid>
        </x-ui.section>

        <x-ui.section title="Notas" description="Contexto que conviene recordar." :level="3">
            <x-ui.card variant="outlined">{{ \App\Support\Ui\CatalogFixtures::LONG_TEXT }}</x-ui.card>
        </x-ui.section>

        <x-ui.section title="Zona de riesgo" :level="3">
            <x-ui.destructive-action label="Eliminar la tarea" action="delete" variant="outlined"
                                     message="La tarea y su historial de progreso se eliminan de forma permanente." />
        </x-ui.section>
    </x-module-shell>
</x-layouts.catalog-screen>
