<x-layouts.catalog-screen title="Arquetipo de registro diario">
    <x-module-shell module="water" title="Hidratación" subtitle="Registro del día" archetype="daily-log">
        <x-slot:actions>
            <x-ui.action variant="filled" icon="bi-plus-lg">Registrar</x-ui.action>
        </x-slot:actions>

        <x-slot:controls>
            <x-ui.filter-bar label="Día registrado">
                <x-slot:chips>
                    <x-ui.chip variant="assist" icon="bi-chevron-left">Ayer</x-ui.chip>
                    <x-ui.chip variant="filter" :selected="true">Hoy</x-ui.chip>
                    <x-ui.chip variant="assist" icon="bi-chevron-right">Mañana</x-ui.chip>
                </x-slot:chips>
            </x-ui.filter-bar>
        </x-slot:controls>

        <x-slot:rail>
            <x-context-widget title="Meta diaria" icon="bi-droplet">
                <x-ui.progress :value="2350" :max="2500" tone="success" label="Meta diaria" valueText="2350 de 2500 ml" />
            </x-context-widget>
        </x-slot:rail>

        <x-ui.section title="Registros de hoy" description="El último registro aparece primero.">
            <x-ui.list label="Registros de hoy">
                <x-ui.list-item headline="500 ml" supporting="Botella · 18:20">
                    <x-slot:leading><x-ui.icon name="bi-droplet-fill" tone="info" /></x-slot:leading>
                    <x-slot:trailing>
                        <x-ui.destructive-action label="Eliminar el registro" action="delete" risk="reversible" :iconOnly="true" size="sm" />
                    </x-slot:trailing>
                </x-ui.list-item>
                <x-ui.list-item headline="350 ml" supporting="Vaso · 15:05">
                    <x-slot:leading><x-ui.icon name="bi-droplet-fill" tone="info" /></x-slot:leading>
                </x-ui.list-item>
            </x-ui.list>
        </x-ui.section>

        <x-ui.section title="Sin registros posteriores" :level="3">
            <x-ui.state variant="empty" message="Registra tu próxima toma para cerrar el día.">
                <x-slot:actions>
                    <x-ui.action variant="outlined" icon="bi-plus-lg">Registrar ahora</x-ui.action>
                </x-slot:actions>
            </x-ui.state>
        </x-ui.section>
    </x-module-shell>
</x-layouts.catalog-screen>
