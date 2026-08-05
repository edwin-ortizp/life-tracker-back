<x-catalog.example title="Resumen de módulo" description="La rejilla reparte métricas equivalentes y colapsa a una columna en móvil.">
    <div class="md-catalog__demo--stack">
        <x-ui.metric-grid label="Resumen de la semana">
            @foreach (\App\Support\Ui\CatalogFixtures::metrics() as $metric)
                <x-ui.metric :label="$metric['label']" :value="$metric['value']" :unit="$metric['unit']"
                             :support="$metric['support']" :tone="$metric['tone']" />
            @endforeach
        </x-ui.metric-grid>
    </div>
</x-catalog.example>

<x-catalog.example title="Densidad mínima" description="Con una sola métrica la rejilla no deja huecos.">
    <div class="md-catalog__demo--stack">
        <x-ui.metric-grid>
            <x-ui.metric label="Racha activa" value="9" unit="días" tone="success" />
        </x-ui.metric-grid>
    </div>
</x-catalog.example>
