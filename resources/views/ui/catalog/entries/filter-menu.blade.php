<div x-data="{ openMenu: null }" @click.outside="openMenu = null">
    <x-catalog.example title="Con y sin selección" description="El chip muestra la opción activa y vuelve a su etiqueta al limpiarse.">
        <x-ui.filter-menu name="status" label="Estado" :options="\App\Support\Ui\CatalogFixtures::statusOptions()" selected="done" />
        <x-ui.filter-menu name="period" label="Periodo" :options="\App\Support\Ui\CatalogFixtures::periodOptions()" />
    </x-catalog.example>

    <x-catalog.example title="Alineación final y lista larga" description="Cerca del borde el menú se alinea al final para no desbordar la página.">
        <x-ui.filter-menu name="module" label="Módulo" align="end" allLabel="Todos los módulos" :options="[
            'tasks' => 'Tareas',
            'meals' => 'Comidas',
            'water' => 'Hidratación',
            'health' => 'Salud',
            'habits' => 'Hábitos',
            'vehicles' => 'Vehículos',
            'relationships' => 'Relaciones',
        ]" selected="vehicles" />
    </x-catalog.example>
</div>
