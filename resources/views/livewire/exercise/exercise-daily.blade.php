@php
    use App\Support\Ui\DataState;

    $logsState = DataState::resolve(visible: $logs->count(), total: $logs->count());
@endphp

<x-module-shell module="exercise" x-data="{ showDialog: $wire.entangle('showForm') }">
    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Registrar ejercicio', 'icon' => 'bi-plus-lg', 'action' => 'openForm']" />
    </x-slot:actions>

    <x-slot:controls>
        <p class="md-body-medium mb-0">{{ ucfirst(\Carbon\Carbon::parse($selectedDate)->translatedFormat('l d \d\e F')) }}</p>
    </x-slot:controls>

    <x-ui.section title="Resumen del día" :level="2">
        <x-ui.metric-grid label="Resumen del día">
            <x-ui.metric label="Calorías" icon="bi-fire" tone="danger" :value="number_format($totalCalories)" unit="kcal" />
            <x-ui.metric label="Duración" icon="bi-clock" tone="info" :value="$totalDuration" unit="min" />
            <x-ui.metric label="Pasos" icon="bi-signpost-2" tone="success" :value="number_format($totalSteps)" unit="pasos" />
        </x-ui.metric-grid>
    </x-ui.section>

    <x-ui.section title="Actividades del día" :level="3">
        @if ($logsState === DataState::CONTENT)
            <x-ui.list label="Actividades del día">
                @foreach ($logs as $log)
                    @php
                        $detail = collect([
                            $log->duration ? $log->duration.' min' : null,
                            $log->calories ? $log->calories.' kcal' : null,
                            $log->sets && $log->reps ? $log->sets.'x'.$log->reps : null,
                            $log->weight ? $log->weight.' kg' : null,
                            $log->distance ? $log->distance.' km' : null,
                            $log->steps ? number_format($log->steps).' pasos' : null,
                        ])->filter()->implode(' · ');
                    @endphp

                    <x-ui.list-item :headline="$log->exerciseType?->name ?? 'Ejercicio'"
                                    :supporting="$detail"
                                    wire:key="exercise-{{ $log->id }}">
                        <x-slot:leading>
                            <span class="md-list-icon-circle" aria-hidden="true">{{ $log->exerciseType?->icon ?? '🏃' }}</span>
                        </x-slot:leading>

                        @if ($log->notes)
                            <p class="md-list-item-supporting md-list-item-note">{{ $log->notes }}</p>
                        @endif

                        <x-slot:trailing>
                            <x-ui.icon-action icon="bi-pencil" label="Editar el registro de {{ $log->exerciseType?->name ?? 'ejercicio' }}"
                                              wire:click="openForm('{{ $log->id }}')" />
                            <x-ui.destructive-action label="Eliminar el registro de {{ $log->exerciseType?->name ?? 'ejercicio' }}" :iconOnly="true"
                                                     action="delete('{{ $log->id }}')"
                                                     title="Eliminar registro"
                                                     message="El registro de actividad se elimina de forma permanente." />
                        </x-slot:trailing>
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
        @else
            <x-ui.state variant="empty" icon="bi-activity" title="Sin ejercicios registrados"
                        message="Registra tu primera actividad para ver aquí el detalle del día.">
                <x-slot:actions>
                    <x-ui.action variant="filled" icon="bi-plus-lg" wire:click="openForm">Registrar ejercicio</x-ui.action>
                </x-slot:actions>
            </x-ui.state>
        @endif
    </x-ui.section>

    <x-ui.dialog state="showDialog" title="{{ $editingId ? 'Editar ejercicio' : 'Nuevo ejercicio' }}">
        <x-ui.select name="exerciseTypeId" label="Tipo de ejercicio" placeholder="Seleccionar..."
                     :options="$exerciseTypes->mapWithKeys(fn ($type) => [$type->id => ($type->icon ?? '🏃').' '.$type->name])->all()"
                     wire:model.live="exerciseTypeId" />

        <div class="md-field-pair">
            <x-ui.field name="duration" label="Duración (min)" type="number" min="0" wire:model.live="duration" />
            <x-ui.field name="calories" label="Calorías" type="number" min="0" wire:model="calories" />
        </div>

        <div class="md-field-trio">
            <x-ui.field name="sets" label="Series" type="number" min="0" wire:model="sets" />
            <x-ui.field name="reps" label="Reps" type="number" min="0" wire:model="reps" />
            <x-ui.field name="weight" label="Peso (kg)" type="number" min="0" step="0.5" wire:model="weight" />
        </div>

        <div class="md-field-pair">
            <x-ui.field name="distance" label="Distancia (km)" type="number" min="0" step="0.1" wire:model="distance" />
            <x-ui.field name="steps" label="Pasos" type="number" min="0" wire:model="steps" />
        </div>

        <x-ui.field name="notes" label="Notas (opcional)" wire:model="notes" />

        <x-slot:actions>
            <x-ui.action variant="text" x-on:click="showDialog = false">Cancelar</x-ui.action>
            <x-ui.action variant="filled" icon="bi-check-lg" wire:click="save">{{ $editingId ? 'Actualizar' : 'Guardar' }}</x-ui.action>
        </x-slot:actions>
    </x-ui.dialog>
</x-module-shell>
