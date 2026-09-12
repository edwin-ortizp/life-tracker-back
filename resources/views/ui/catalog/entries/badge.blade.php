<x-catalog.example title="Tonos" description="El badge acompaña a otro elemento y hereda su significado.">
    <x-ui.badge>4</x-ui.badge>
    <x-ui.badge tone="primary">7</x-ui.badge>
    <x-ui.badge tone="success">12</x-ui.badge>
    <x-ui.badge tone="warning">2</x-ui.badge>
    <x-ui.badge tone="danger">3</x-ui.badge>
    <x-ui.badge tone="info">9</x-ui.badge>
</x-catalog.example>

<x-catalog.example title="Valores extremos" description="Conteos largos y nombre accesible explícito.">
    <x-ui.badge tone="primary" label="128 tareas pendientes">128</x-ui.badge>
    <x-ui.badge tone="primary" label="Más de noventa y nueve">99+</x-ui.badge>
</x-catalog.example>

<x-catalog.example title="En esquina" description="Badge de notificación sobre un botón, por ejemplo el conteo de filtros activos.">
    <x-ui.action variant="outlined" icon="bi-sliders" class="md-catalog__badge-host">Filtros <x-ui.badge placement="corner" label="2 filtros activos">2</x-ui.badge></x-ui.action>
</x-catalog.example>
