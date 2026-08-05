<x-catalog.example title="Énfasis" description="Estándar, rellena y tonal. Siempre declaran un nombre accesible.">
    <x-ui.icon-action icon="bi-pencil" label="Editar registro" />
    <x-ui.icon-action icon="bi-plus-lg" label="Añadir registro" emphasis="filled" />
    <x-ui.icon-action icon="bi-share" label="Compartir registro" emphasis="tonal" />
</x-catalog.example>

<x-catalog.example title="Tamaños y tonos" description="Se usan cuando la densidad o el significado lo requieren.">
    <x-ui.icon-action icon="bi-trash" label="Eliminar registro" tone="danger" size="sm" />
    <x-ui.icon-action icon="bi-check2" label="Completar registro" tone="success" />
    <x-ui.icon-action icon="bi-exclamation-triangle" label="Revisar registro" tone="warning" size="lg" />
</x-catalog.example>

<x-catalog.example title="Estados" description="Cargando y deshabilitada conservan el nombre accesible.">
    <x-ui.icon-action icon="bi-arrow-clockwise" label="Sincronizar" />
    <x-ui.icon-action icon="bi-arrow-clockwise" label="Sincronizando" :loading="true" />
    <x-ui.icon-action icon="bi-arrow-clockwise" label="Sincronización no disponible" :disabled="true" />
</x-catalog.example>
