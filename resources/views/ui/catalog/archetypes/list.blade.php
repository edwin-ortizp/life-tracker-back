<x-layouts.catalog-screen title="Arquetipo de listado">
    <x-module-shell module="tasks" title="Tareas" subtitle="Todo lo que quieres sostener esta semana" archetype="list">
        <x-slot:actions>
            <x-ui.action variant="outlined" icon="bi-upload">Importar</x-ui.action>
            <x-ui.action variant="filled" icon="bi-plus-lg">Nueva tarea</x-ui.action>
        </x-slot:actions>

        <x-slot:controls>
            <x-ui.filter-bar search="search" placeholder="Buscar tareas" label="Filtros de tareas">
                <x-slot:chips>
                    <x-ui.chip variant="filter" :selected="true">Hoy</x-ui.chip>
                    <x-ui.chip variant="filter">Esta semana</x-ui.chip>
                    <div class="md-chip-rail__divider"></div>
                    <x-ui.filter-menu name="status" label="Estado" :options="\App\Support\Ui\CatalogFixtures::statusOptions()" selected="doing" />
                </x-slot:chips>
            </x-ui.filter-bar>
        </x-slot:controls>

        <x-slot:rail>
            <x-context-widget title="Resumen" icon="bi-stars">
                <x-ui.metric label="Tareas completadas" value="12" support="De 18 planificadas" tone="primary" />
            </x-context-widget>
        </x-slot:rail>

        <x-ui.section title="Pendientes" description="Ordenadas por fecha de vencimiento.">
            <x-ui.list label="Tareas pendientes">
                @foreach (\App\Support\Ui\CatalogFixtures::listItems() as $item)
                    <x-ui.list-item :headline="$item['headline']" :supporting="$item['supporting']">
                        <x-slot:leading><x-ui.icon name="bi-circle" :tone="$item['tone']" /></x-slot:leading>
                        <x-slot:trailing>
                            <x-ui.icon-action icon="bi-pencil" label="Editar la tarea" size="sm" />
                            <x-ui.destructive-action label="Eliminar la tarea" action="delete" :iconOnly="true" size="sm" />
                        </x-slot:trailing>
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
        </x-ui.section>
    </x-module-shell>
</x-layouts.catalog-screen>
