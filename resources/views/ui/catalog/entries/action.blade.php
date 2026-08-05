<x-catalog.example title="Variantes de énfasis" description="Solo una acción domina por contexto; el resto se presenta como secundaria.">
    <x-ui.action variant="filled" icon="bi-plus-lg">Nueva tarea</x-ui.action>
    <x-ui.action variant="tonal">Duplicar</x-ui.action>
    <x-ui.action variant="outlined">Importar</x-ui.action>
    <x-ui.action variant="text">Cancelar</x-ui.action>
</x-catalog.example>

<x-catalog.example title="Tamaños" description="Densidades compacta, estándar y amplia.">
    <x-ui.action variant="tonal" size="sm">Añadir</x-ui.action>
    <x-ui.action variant="tonal">Añadir</x-ui.action>
    <x-ui.action variant="tonal" size="lg">Añadir</x-ui.action>
</x-catalog.example>

<x-catalog.example title="Tonos semánticos" description="El tono comunica el significado de la acción, nunca un color arbitrario.">
    <x-ui.action variant="tonal" tone="success">Confirmar</x-ui.action>
    <x-ui.action variant="tonal" tone="warning">Revisar</x-ui.action>
    <x-ui.action variant="tonal" tone="danger">Eliminar</x-ui.action>
    <x-ui.action variant="tonal" tone="info">Detalles</x-ui.action>
</x-catalog.example>

<x-catalog.example title="Estados" description="Cargando y deshabilitada impiden activaciones duplicadas y lo comunican con semántica accesible.">
    <x-ui.action variant="filled">Normal</x-ui.action>
    <x-ui.action variant="filled" :loading="true">Guardando</x-ui.action>
    <x-ui.action variant="filled" :disabled="true">No disponible</x-ui.action>
</x-catalog.example>

<x-catalog.example title="Enlace de acción y contenido extenso" description="La misma apariencia sirve para navegar y admite etiquetas largas.">
    <x-ui.action variant="outlined" href="{{ route('ui.catalog') }}" icon="bi-box-arrow-up-right">Volver al catálogo</x-ui.action>
    <x-ui.action variant="tonal">{{ \App\Support\Ui\CatalogFixtures::LONG_TEXT }}</x-ui.action>
</x-catalog.example>
