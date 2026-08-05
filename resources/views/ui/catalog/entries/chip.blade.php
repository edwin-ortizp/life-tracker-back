<x-catalog.example title="Variantes" description="Cada variante expresa un propósito distinto dentro del mismo lenguaje visual.">
    <x-ui.chip variant="assist" icon="bi-lightbulb">Sugerir plan</x-ui.chip>
    <x-ui.chip variant="filter">Hoy</x-ui.chip>
    <x-ui.chip variant="input" icon="bi-tag">Hogar</x-ui.chip>
    <x-ui.chip variant="suggestion">Añadir agua</x-ui.chip>
</x-catalog.example>

<x-catalog.example title="Estado seleccionado" description="El estado se comunica visualmente y con semántica accesible.">
    <x-ui.chip variant="filter" :selected="true">Hoy</x-ui.chip>
    <x-ui.chip variant="filter">Semana</x-ui.chip>
    <x-ui.chip variant="filter" :disabled="true">Mes</x-ui.chip>
</x-catalog.example>

<x-catalog.example title="Tonos de estado" description="El chip tonal transmite el estado de un registro.">
    <x-ui.chip variant="tonal" tone="primary">En curso</x-ui.chip>
    <x-ui.chip variant="tonal" tone="success">Completada</x-ui.chip>
    <x-ui.chip variant="tonal" tone="warning">Por revisar</x-ui.chip>
    <x-ui.chip variant="tonal" tone="danger">Vencida</x-ui.chip>
    <x-ui.chip variant="tonal" tone="info">Programada</x-ui.chip>
</x-catalog.example>

<x-catalog.example title="Contenido extenso" description="Una etiqueta larga no rompe el rail ni desborda la página.">
    <x-ui.chip variant="tonal">{{ \App\Support\Ui\CatalogFixtures::LONG_TEXT }}</x-ui.chip>
</x-catalog.example>
