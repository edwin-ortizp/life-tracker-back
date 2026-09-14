<x-catalog.example title="Acciones por fila" description="Acción principal visible y el resto en el menú; en card compacta o móvil se colapsa a un único ⋮.">
    <x-ui.row-actions label="Más acciones de Preparar propuesta">
        <x-slot:primary>Completar</x-slot:primary>
        <x-ui.menu-item icon="bi-pencil">Editar</x-ui.menu-item>
        <x-ui.menu-divider />
        <x-ui.menu-item icon="bi-trash" tone="danger">Eliminar</x-ui.menu-item>
    </x-ui.row-actions>
</x-catalog.example>
