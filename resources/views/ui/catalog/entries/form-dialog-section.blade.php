<x-catalog.example title="Sección activa" description="Solo se muestra la sección seleccionada; el resto conserva sus datos oculto.">
    <div x-data="{ section: 'basic' }">
        <x-ui.form-dialog-section name="basic" title="Información básica" description="Registra los datos principales.">
            <div class="md-form-dialog__grid">
                <x-ui.field name="catalog-section-title" label="Título" :required="true" />
                <x-ui.field name="catalog-section-date" type="date" label="Fecha" />
            </div>
        </x-ui.form-dialog-section>
    </div>
</x-catalog.example>
