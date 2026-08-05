<x-layouts.catalog-screen title="Arquetipo de dashboard">
    <x-module-shell module="statistics" title="Estadísticas" subtitle="Cómo se comporta tu semana" archetype="dashboard">
        <x-slot:actions>
            <x-ui.action variant="filled" icon="bi-download">Exportar</x-ui.action>
        </x-slot:actions>

        <x-slot:controls>
            <x-ui.filter-bar label="Periodo del resumen">
                <x-slot:chips>
                    @foreach (\App\Support\Ui\CatalogFixtures::periodOptions() as $value => $label)
                        <x-ui.chip variant="filter" :selected="$value === 'week'">{{ $label }}</x-ui.chip>
                    @endforeach
                </x-slot:chips>
            </x-ui.filter-bar>
        </x-slot:controls>

        <x-slot:rail>
            <x-context-widget title="Atajos" icon="bi-signpost-split">
                <x-ui.action variant="text" href="{{ route('ui.catalog') }}">Ver el catálogo</x-ui.action>
            </x-context-widget>
        </x-slot:rail>

        <x-ui.section title="Resumen de la semana">
            <x-ui.metric-grid label="Indicadores de la semana">
                @foreach (\App\Support\Ui\CatalogFixtures::metrics() as $metric)
                    <x-ui.metric :label="$metric['label']" :value="$metric['value']" :unit="$metric['unit']"
                                 :support="$metric['support']" :tone="$metric['tone']" />
                @endforeach
            </x-ui.metric-grid>
        </x-ui.section>

        <x-ui.section title="Progreso por módulo" :level="3">
            <x-ui.card variant="outlined">
                <x-ui.progress :value="80" tone="success" label="Hidratación" valueText="80%" />
                <x-ui.progress :value="45" label="Tareas" valueText="45%" />
                <x-ui.progress :value="20" tone="warning" label="Ejercicio" valueText="20%" />
            </x-ui.card>
        </x-ui.section>
    </x-module-shell>
</x-layouts.catalog-screen>
