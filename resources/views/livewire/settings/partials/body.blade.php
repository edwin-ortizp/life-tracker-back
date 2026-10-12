<x-ui.section title="Datos físicos" description="Se usan para calcular calorías, hidratación y tu calendario de vida." :level="2">
    <x-ui.card variant="outlined" icon="bi-heart-pulse" iconTone="secondary">
        <div class="md-field-pair">
            <x-ui.field name="currentWeightKg" label="Peso actual (kg)" type="number" min="20" max="500" step="0.1" wire:model="currentWeightKg" />
            <x-ui.field name="heightCm" label="Estatura (cm)" type="number" min="50" max="300" step="1" wire:model="heightCm" />
        </div>

        <div class="md-field-pair">
            <x-ui.field name="birthDate" label="Fecha de nacimiento" type="date" wire:model="birthDate" />
            <x-ui.field name="lifeExpectancyYears" label="Expectativa de vida (años)" type="number" min="1" max="130" step="1"
                        help="Referencia personal opcional para tu calendario de vida." wire:model="lifeExpectancyYears" />
        </div>

        <x-ui.select name="activityLevel" label="Nivel de actividad" placeholder="No especificado"
                     :options="[
                         'sedentary' => 'Sedentario',
                         'light' => 'Ligero',
                         'moderate' => 'Moderado',
                         'high' => 'Alto',
                         'very_high' => 'Muy alto',
                     ]"
                     wire:model="activityLevel" />

        <x-slot:actions>
            <x-ui.action variant="filled" icon="bi-check-lg" wire:click="updateProfile">Guardar datos físicos</x-ui.action>
        </x-slot:actions>
    </x-ui.card>

    <x-ui.card variant="outlined">
        <dl class="md-context-list">
            <div><dt>Edad</dt><dd>{{ $age !== null ? $age.' años' : '—' }}</dd></div>
            <div><dt>IMC</dt><dd>{{ $bmi !== null ? number_format($bmi, 1, ',', '.') : '—' }}</dd></div>
            <div><dt>Meta de agua</dt><dd>{{ $waterGoal ? number_format($waterGoal / 1000, 1, ',', '.').' L' : '—' }}</dd></div>
        </dl>
    </x-ui.card>
</x-ui.section>
