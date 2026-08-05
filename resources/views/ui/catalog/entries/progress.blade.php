<x-catalog.example title="Valores y tonos" description="El valor se transmite con la custom property `--md-progress-value`, nunca con estilo arbitrario.">
    <div class="md-catalog__demo--stack">
        <x-ui.progress :value="60" label="Avance del objetivo" valueText="60%" />
        <x-ui.progress :value="95" tone="success" label="Hidratación" valueText="2350 de 2500 ml" />
        <x-ui.progress :value="40" tone="warning" label="Presupuesto" valueText="40%" />
        <x-ui.progress :value="12" tone="danger" label="Mantenimiento vencido" valueText="12%" />
    </div>
</x-catalog.example>

<x-catalog.example title="Extremos e indeterminado" description="Sin valor conocido el indicador es indeterminado; con cero o máximo sigue siendo legible.">
    <div class="md-catalog__demo--stack">
        <x-ui.progress :value="0" label="Sin avance" valueText="0%" />
        <x-ui.progress :value="120" :max="100" label="Por encima de la meta" valueText="120%" />
        <x-ui.progress label="Cargando datos" />
    </div>
</x-catalog.example>
