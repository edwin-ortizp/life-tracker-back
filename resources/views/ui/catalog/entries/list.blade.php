<x-catalog.example title="Colección" description="La lista aporta la estructura; cada elemento declara sus regiones.">
    <div class="md-catalog__demo--stack">
        <x-ui.list label="Tareas de hoy">
            @foreach (\App\Support\Ui\CatalogFixtures::listItems() as $item)
                <x-ui.list-item :headline="$item['headline']" :supporting="$item['supporting']">
                    <x-slot:leading><x-ui.icon name="bi-circle" :tone="$item['tone']" /></x-slot:leading>
                    <x-slot:trailing><x-ui.icon-action icon="bi-three-dots" label="Más acciones" size="sm" /></x-slot:trailing>
                </x-ui.list-item>
            @endforeach
        </x-ui.list>
    </div>
</x-catalog.example>

<x-catalog.example title="Colección mínima" description="Un solo elemento conserva la misma altura y separación.">
    <div class="md-catalog__demo--stack">
        <x-ui.list label="Recordatorios">
            <x-ui.list-item headline="Revisar la agenda" supporting="Sin fecha" />
        </x-ui.list>
    </div>
</x-catalog.example>
