<p class="md-catalog__note md-body-small">
    El snackbar se posiciona sobre la ventana. Los ejemplos con estado lo muestran al activarlos.
</p>

<x-catalog.example title="Confirmación" description="Anuncia el cambio de forma no modal y ofrece deshacerlo.">
    <div x-data="{ saved: false }">
        <x-ui.action variant="tonal" x-on:click="saved = true">Mostrar confirmación</x-ui.action>

        <x-ui.snackbar state="saved">
            Registro guardado

            <x-slot:actions>
                <x-ui.action variant="text" size="sm" x-on:click="saved = false">Deshacer</x-ui.action>
            </x-slot:actions>
        </x-ui.snackbar>
    </div>
</x-catalog.example>

<x-catalog.example title="Aviso de error" description="El tono de error se usa cuando la operación no se completó.">
    <div x-data="{ failed: false }">
        <x-ui.action variant="outlined" tone="danger" x-on:click="failed = true">Mostrar aviso de error</x-ui.action>

        <x-ui.snackbar state="failed" tone="danger">
            No pudimos guardar el registro

            <x-slot:actions>
                <x-ui.action variant="text" size="sm" x-on:click="failed = false">Reintentar</x-ui.action>
            </x-slot:actions>
        </x-ui.snackbar>
    </div>
</x-catalog.example>
