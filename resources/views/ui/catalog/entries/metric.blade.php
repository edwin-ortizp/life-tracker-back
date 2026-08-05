<x-catalog.example title="Valor, unidad y apoyo" description="La métrica admite etiquetas largas y valores ausentes sin cambiar su jerarquía.">
    @foreach (\App\Support\Ui\CatalogFixtures::metrics() as $metric)
        <x-ui.metric :label="$metric['label']" :value="$metric['value']" :unit="$metric['unit']"
                     :support="$metric['support']" :tone="$metric['tone']" />
    @endforeach
</x-catalog.example>

<x-catalog.example title="Con icono y contenido adicional" description="La métrica puede componer otros componentes canónicos.">
    <x-ui.metric label="Avance del objetivo" value="60" unit="%" icon="bi-flag" tone="primary">
        <x-ui.progress :value="60" tone="primary" />
    </x-ui.metric>
</x-catalog.example>
