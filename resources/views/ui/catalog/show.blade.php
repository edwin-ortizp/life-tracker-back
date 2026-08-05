<x-layouts.catalog :layers="$layers" :current="$entry['name']" :title="$entry['title'].' · Catálogo'">
    <header class="md-catalog__header">
        <p class="md-label-medium">{{ \App\Support\Ui\ComponentCatalog::LAYERS[$entry['layer']] }}</p>
        <h1 class="md-headline-medium">{{ $entry['title'] }}</h1>
        <p class="md-body-medium">{{ $entry['description'] }}</p>
        <p class="md-body-small">Etiqueta Blade: <code>&lt;x-ui.{{ $entry['name'] }} /&gt;</code></p>
    </header>

    <x-ui.section title="Uso" description="Punto de partida recomendado para esta superficie." :level="2">
        <pre class="md-catalog__code"><code>{{ $entry['usage'] }}</code></pre>
    </x-ui.section>

    <div class="md-catalog__examples" data-component="{{ $entry['name'] }}">
        @include($partial)
    </div>
</x-layouts.catalog>
