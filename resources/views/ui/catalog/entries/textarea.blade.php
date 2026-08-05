<x-catalog.example title="Densidades" description="Las filas definen la altura inicial; el contenido siempre se puede desplazar.">
    <div class="md-catalog__demo--stack">
        <x-ui.textarea name="notes" label="Notas" rows="2" help="Opcional." />
        <x-ui.textarea name="reflection" label="Reflexión" rows="5" :value="\App\Support\Ui\CatalogFixtures::LONG_TEXT" />
    </div>
</x-catalog.example>

<x-catalog.example title="Error" description="El mensaje se relaciona con el control y se anuncia como alerta.">
    <div class="md-catalog__demo--stack">
        <x-ui.textarea name="detail" label="Detalle" error="Escribe al menos una frase." />
    </div>
</x-catalog.example>
