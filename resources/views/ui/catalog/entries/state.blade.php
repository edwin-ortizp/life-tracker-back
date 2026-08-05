<x-catalog.example title="Inicial y cargando" description="Antes de pedir datos y mientras llegan, la pantalla conserva su estructura.">
    <div class="md-catalog__demo--stack">
        <x-ui.state variant="initial" message="Elige un periodo para ver el resumen." />
        <x-ui.state variant="loading" message="Estamos reuniendo tus registros." />
    </div>
</x-catalog.example>

<x-catalog.example title="Colección vacía" description="Todavía no existe ningún registro: la acción propone crear el primero.">
    <div class="md-catalog__demo--stack">
        <x-ui.state variant="empty" message="Cuando registres tu primera tarea aparecerá aquí.">
            <x-slot:actions>
                <x-ui.action variant="filled" icon="bi-plus-lg">Nueva tarea</x-ui.action>
            </x-slot:actions>
        </x-ui.state>
    </div>
</x-catalog.example>

<x-catalog.example title="Sin resultados filtrados" description="La colección existe pero los filtros la ocultan: la acción ofrece ajustarlos.">
    <div class="md-catalog__demo--stack">
        <x-ui.state variant="filtered-empty" message="Hay 18 tareas, pero ninguna coincide con los filtros activos.">
            <x-slot:actions>
                <x-ui.action variant="outlined" icon="bi-x-circle">Limpiar filtros</x-ui.action>
            </x-slot:actions>
        </x-ui.state>
    </div>
</x-catalog.example>

<x-catalog.example title="Error recuperable" description="El problema se explica en lenguaje útil y se ofrece reintentar.">
    <div class="md-catalog__demo--stack">
        <x-ui.state variant="error" message="Revisa tu conexión e inténtalo otra vez. No se perdió ningún registro.">
            <x-slot:actions>
                <x-ui.action variant="outlined" icon="bi-arrow-clockwise">Reintentar</x-ui.action>
            </x-slot:actions>
        </x-ui.state>
    </div>
</x-catalog.example>
