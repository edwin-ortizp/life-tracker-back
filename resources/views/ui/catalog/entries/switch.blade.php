<x-catalog.example title="Estados" description="Encendido, apagado, con ayuda y deshabilitado.">
    <x-ui.switch name="catalog-switch-off" label="Incluir en lista de compras" />
    <x-ui.switch name="catalog-switch-on" label="Recordatorios activos" :checked="true" />
    <x-ui.switch name="catalog-switch-help" label="Sincronizar con el calendario" help="Se aplica de inmediato en todos tus dispositivos." />
    <x-ui.switch name="catalog-switch-disabled" label="Opción no disponible" :disabled="true" />
</x-catalog.example>
