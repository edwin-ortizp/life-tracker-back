<x-catalog.example title="Siluetas de carga" description="Cada variante imita la forma de lo que va a llegar: lineas sueltas, un bloque, tarjetas o filas de lista.">
    <div class="md-catalog__demo--stack">
        <x-ui.skeleton variant="line" :lines="3" label="Cargando texto" />
        <x-ui.skeleton variant="block" label="Cargando grafico" />
    </div>
</x-catalog.example>

<x-catalog.example title="Listas y tarjetas" description="Se usan en las pantallas paginadas mientras Livewire resuelve un filtro, una busqueda o un cambio de pagina.">
    <div class="md-catalog__demo--stack">
        <x-ui.skeleton variant="list" :lines="3" label="Cargando tareas" />
        <x-ui.skeleton variant="card" :lines="2" label="Cargando recetas" />
    </div>
</x-catalog.example>
