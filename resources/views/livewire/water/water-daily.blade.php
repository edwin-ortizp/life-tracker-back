@php
    use App\Support\Ui\DataState;

    $logsState = DataState::resolve(visible: $logs->count(), total: $logs->count());
    $drinksState = DataState::resolve(visible: $drinkTypes->count(), total: $drinkTypes->count());
@endphp

<x-module-shell module="water" x-data="{ showDialog: $wire.entangle('showForm') }">
    <x-slot:actions>
        <x-date-navigator :date="$selectedDate" format="D d M" />
        <x-module-actions :primary="['label' => 'Registrar', 'icon' => 'bi-plus-lg', 'action' => 'openForm']" />
    </x-slot:actions>

    <x-ui.section title="Progreso del día" :level="2">
        <x-ui.metric-grid label="Progreso del día">
            <x-ui.metric label="Hidratación registrada" icon="bi-droplet-fill" tone="primary"
                         :value="number_format($totalHydration)" unit="ml"
                         :support="'Meta de '.number_format($dailyGoal).' ml'">
                <x-ui.progress :value="$percentage" tone="primary" label="Avance del día"
                               :valueText="number_format($percentage, 0).'% completado'" />
            </x-ui.metric>
            <x-ui.metric label="Meta alcanzada este mes" icon="bi-calendar-check" tone="success"
                         :value="$monthData['completed_days']" unit="días" support="Días que cumplieron la meta" />
            <x-ui.metric label="Promedio del mes" icon="bi-activity"
                         :value="number_format($monthData['average'])" unit="ml" support="Hidratación diaria" />
        </x-ui.metric-grid>
    </x-ui.section>

    <x-ui.section title="Agregar rápido" description="Registra 250 ml de una bebida habitual." :level="3">
        <x-ui.filter-bar label="Bebidas habituales">
            <x-slot:chips>
                @foreach ($drinkTypes->take(6) as $type)
                    <x-ui.chip variant="suggestion" wire:click="quickAdd('{{ $type->id }}', 250)" wire:key="quick-{{ $type->id }}">
                        {{ $type->icon ?? '💧' }} {{ $type->name }} (250 ml)
                    </x-ui.chip>
                @endforeach
            </x-slot:chips>
        </x-ui.filter-bar>
    </x-ui.section>

    <x-ui.section title="Registro del día" :level="3">
        @if ($logsState === DataState::CONTENT)
            <x-ui.list label="Registros del día">
                @foreach ($logs as $log)
                    <x-ui.list-item :headline="$log->drink_type"
                                    :supporting="$log->amount.' ml · '.$log->hydration_value.' ml hidratación'"
                                    wire:key="log-{{ $log->id }}">
                        <x-slot:leading>
                            <x-ui.chip variant="tonal" tone="primary">{{ $log->time }}</x-ui.chip>
                        </x-slot:leading>
                        <x-slot:trailing>
                            <x-ui.icon-action icon="bi-pencil" label="Editar el registro de {{ $log->drink_type }}"
                                              wire:click="openForm('{{ $log->id }}')" />
                            <x-ui.destructive-action label="Eliminar el registro de {{ $log->drink_type }}" :iconOnly="true"
                                                     action="delete('{{ $log->id }}')"
                                                     title="Eliminar registro"
                                                     message="El registro de {{ $log->amount }} ml se elimina de forma permanente." />
                        </x-slot:trailing>
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
        @else
            <x-ui.state variant="empty" icon="bi-droplet" title="Sin registros para este día"
                        message="Registra tu primera bebida para ver aquí el detalle del día.">
                <x-slot:actions>
                    <x-ui.action variant="filled" icon="bi-plus-lg" wire:click="openForm">Registrar</x-ui.action>
                </x-slot:actions>
            </x-ui.state>
        @endif
    </x-ui.section>

    <x-slot:rail>
        <x-context-widget title="{{ $monthData['label'] }}" icon="bi-calendar3">
            @include('livewire.water.partials.month-calendar')
            <x-ui.action variant="text" :href="route('water.calendar', ['date' => $selectedDate])">Abrir calendario</x-ui.action>
        </x-context-widget>
        <x-context-widget title="Ritmo mensual" icon="bi-activity" tone="success">
            <dl class="md-context-list">
                <div><dt>Meta alcanzada</dt><dd>{{ $monthData['completed_days'] }} días</dd></div>
                <div><dt>Promedio</dt><dd>{{ number_format($monthData['average']) }} ml</dd></div>
            </dl>
        </x-context-widget>
    </x-slot:rail>

    <x-ui.dialog state="showDialog" title="{{ $editingId ? 'Editar bebida' : 'Nueva bebida' }}">
        <x-ui.select name="drinkTypeId" label="Tipo de bebida" placeholder="Seleccionar..."
                     :options="$drinkTypes->mapWithKeys(fn ($type) => [$type->id => ($type->icon ?? '💧').' '.$type->name.' (x'.$type->hydration_factor.')'])->all()"
                     wire:model="drinkTypeId" />

        <x-ui.field name="amount" label="Cantidad (ml)" type="number" min="1" step="50" wire:model="amount" />

        <x-ui.field name="time" label="Hora" type="time" wire:model="time" />

        <x-ui.filter-bar label="Cantidades habituales">
            <x-slot:chips>
                @foreach ([100, 200, 250, 330, 500] as $preset)
                    <x-ui.chip variant="suggestion" wire:click="$set('amount', {{ $preset }})">{{ $preset }} ml</x-ui.chip>
                @endforeach
            </x-slot:chips>
        </x-ui.filter-bar>

        <x-slot:actions>
            <x-ui.action variant="text" x-on:click="showDialog = false">Cancelar</x-ui.action>
            <x-ui.action variant="filled" icon="bi-check-lg" wire:click="save">{{ $editingId ? 'Actualizar' : 'Guardar' }}</x-ui.action>
        </x-slot:actions>
    </x-ui.dialog>

    @if ($showCatalog)
        <div x-data="{ open: true }">
            <x-ui.dialog state="open" title="Configuración de bebidas" size="lg" x-on:md-surface-close="$wire.closeCatalog()">
                <p class="md-body-small">Administra las bebidas disponibles para registrar tu hidratación.</p>

                @if ($catalogMessage)
                    <x-ui.state variant="initial" icon="bi-info-circle" :title="$catalogMessage" />
                @endif

                <x-ui.section title="Tus bebidas" :level="3">
                    <x-slot:actions>
                        <x-ui.action variant="filled" icon="bi-plus-lg" wire:click="openDrinkTypeForm">Nueva bebida</x-ui.action>
                    </x-slot:actions>

                    @if ($drinksState === DataState::CONTENT)
                        <x-ui.list label="Bebidas configuradas">
                            @foreach ($drinkTypes as $type)
                                <x-ui.list-item :headline="$type->name"
                                                :supporting="'Factor de hidratación: '.$type->hydration_factor"
                                                wire:key="drink-{{ $type->id }}">
                                    <x-slot:leading><span aria-hidden="true">{{ $type->icon ?: '💧' }}</span></x-slot:leading>
                                    <x-slot:trailing>
                                        <x-ui.icon-action icon="bi-pencil" label="Editar la bebida {{ $type->name }}"
                                                          wire:click="openDrinkTypeForm('{{ $type->id }}')" />
                                        <x-ui.destructive-action label="Eliminar la bebida {{ $type->name }}" :iconOnly="true"
                                                                 action="deleteDrinkType('{{ $type->id }}')"
                                                                 title="Eliminar bebida"
                                                                 message="La bebida «{{ $type->name }}» se elimina de forma permanente." />
                                    </x-slot:trailing>
                                </x-ui.list-item>
                            @endforeach
                        </x-ui.list>
                    @else
                        <x-ui.state variant="empty" icon="bi-cup-straw" title="Aún no tienes bebidas configuradas"
                                    message="Crea una bebida para registrarla con un solo toque." />
                    @endif
                </x-ui.section>

                <x-slot:actions>
                    <x-ui.action variant="text" wire:click="closeCatalog">Cerrar</x-ui.action>
                </x-slot:actions>
            </x-ui.dialog>
        </div>
    @endif

    @if ($showDrinkTypeForm)
        <div x-data="{ openDrinkForm: true }">
            <x-ui.dialog state="openDrinkForm" title="{{ $editingDrinkTypeId ? 'Editar bebida' : 'Nueva bebida' }}"
                         x-on:md-surface-close="$wire.closeDrinkTypeForm()">
                <x-ui.field name="catalogDrinkName" label="Nombre" maxlength="255" wire:model="catalogDrinkName" />
                <x-ui.field name="catalogDrinkIcon" label="Icono" maxlength="40" help="Un emoji basta." wire:model="catalogDrinkIcon" />
                <x-ui.field name="catalogHydrationFactor" label="Factor de hidratación" type="number" min="0" max="9.99" step="0.01"
                            help="1,00 equivale a la misma cantidad de hidratación registrada." wire:model="catalogHydrationFactor" />

                <x-slot:actions>
                    <x-ui.action variant="text" wire:click="closeDrinkTypeForm">Cancelar</x-ui.action>
                    <x-ui.action variant="filled" wire:click="saveDrinkType">Guardar bebida</x-ui.action>
                </x-slot:actions>
            </x-ui.dialog>
        </div>
    @endif
</x-module-shell>
