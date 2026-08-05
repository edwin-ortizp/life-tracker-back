<x-catalog.example title="Variantes" description="Contorno, relleno y elevación para distintos niveles de énfasis.">
    <x-ui.card variant="outlined" title="Resumen" icon="bi-stars">Registro constante durante la semana.</x-ui.card>
    <x-ui.card variant="filled" title="Próximo cuidado" icon="bi-heart-pulse" iconTone="secondary">Revisión anual en dos semanas.</x-ui.card>
    <x-ui.card variant="elevated" title="Objetivo" icon="bi-flag" iconTone="tertiary">Sostener la rutina de lectura.</x-ui.card>
</x-catalog.example>

<x-catalog.example title="Con acciones y contenido extenso" description="Las acciones viven en su propia región y el texto largo no desborda.">
    <x-ui.card variant="outlined" :title="\App\Support\Ui\CatalogFixtures::LONG_TEXT" icon="bi-car-front">
        {{ \App\Support\Ui\CatalogFixtures::LONG_TEXT }}

        <x-slot:actions>
            <x-ui.action variant="text">Posponer</x-ui.action>
            <x-ui.action variant="tonal">Planificar</x-ui.action>
        </x-slot:actions>
    </x-ui.card>
</x-catalog.example>

<x-catalog.example title="Sin encabezado" description="Una card puede ser solo contenido.">
    <x-ui.card variant="outlined">Sin encabezado ni acciones.</x-ui.card>
</x-catalog.example>
