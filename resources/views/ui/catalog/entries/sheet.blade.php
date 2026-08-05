<x-catalog.example title="Hoja inferior" description="Misma administración de foco que el diálogo, con una entrada más cercana al pulgar.">
    <div x-data="{ showSheet: false }">
        <x-ui.action variant="tonal" icon="bi-arrow-bar-up" x-on:click="showSheet = true">Abrir hoja</x-ui.action>

        <x-ui.sheet state="showSheet" title="Registrar hidratación">
            <x-ui.field name="sheetAmount" label="Cantidad" type="number" help="En mililitros." />

            <x-slot:actions>
                <x-ui.action variant="text" x-on:click="showSheet = false">Cancelar</x-ui.action>
                <x-ui.action variant="filled" x-on:click="showSheet = false">Registrar</x-ui.action>
            </x-slot:actions>
        </x-ui.sheet>
    </div>
</x-catalog.example>

<x-catalog.example title="Hoja lateral" description="Desde tableta la misma hoja se comporta como una superficie lateral.">
    <div x-data="{ showSide: false }">
        <x-ui.action variant="outlined" x-on:click="showSide = true">Abrir hoja lateral</x-ui.action>

        <x-ui.sheet state="showSide" title="Contexto de la relación" placement="side">
            <p class="md-body-medium">{{ \App\Support\Ui\CatalogFixtures::LONG_TEXT }}</p>
        </x-ui.sheet>
    </div>
</x-catalog.example>
