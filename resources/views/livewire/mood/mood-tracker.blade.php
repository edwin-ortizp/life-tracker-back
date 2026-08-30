@php
    use App\Support\Ui\DataState;

    $moodState = DataState::resolve(visible: $moodEntries->count(), total: $moodEntries->count());
    $energyState = DataState::resolve(visible: $energyEntries->count(), total: $energyEntries->count());
@endphp

<x-module-shell module="mood" x-data="{ showEnergyDialog: $wire.entangle('showEnergyForm') }">
    <x-slot:actions>
        <x-module-actions
            :primary="['label' => 'Registrar estado', 'icon' => 'bi-emoji-smile', 'action' => 'openMoodCatalog']"
            :secondary="[
                ['label' => 'Registrar energía', 'icon' => 'bi-lightning-charge', 'action' => 'openEnergyForm'],
                ['label' => 'Escribir en el diario', 'icon' => 'bi-journal-text', 'href' => route('journal', ['date' => $selectedDate])],
            ]" />
    </x-slot:actions>

    <x-slot:controls>
        <p class="md-body-medium mb-0">{{ ucfirst(\Carbon\Carbon::parse($selectedDate)->translatedFormat('l d \d\e F')) }}</p>
    </x-slot:controls>

    {{-- Registro directo: las emociones prioritarias primero, el catálogo a una acción. --}}
    <x-ui.section title="¿Cómo te sientes?" :level="2">
        <x-ui.card variant="elevated">
            @if ($prioritizedStates->isEmpty())
                <x-mood-empty-catalog />
            @else
                <div class="md-mood-picker" role="group" aria-label="Registrar una emoción">
                    @foreach ($prioritizedStates as $state)
                        <button type="button" wire:click="saveMood('{{ $state->id }}')" wire:loading.attr="disabled"
                                class="md-mood-picker__item" title="{{ $state->text }}" aria-label="Registrar {{ $state->text }}"
                                wire:key="mood-state-{{ $state->id }}">
                            <span class="md-mood-picker__emoji" aria-hidden="true">{{ $state->emoji }}</span>
                            <span class="md-label-small">{{ $state->text }}</span>
                        </button>
                    @endforeach
                    <button type="button" wire:click="openMoodCatalog" class="md-mood-picker__item md-mood-picker__item--more">
                        <span class="md-mood-picker__emoji" aria-hidden="true"><i class="bi bi-three-dots"></i></span>
                        <span class="md-label-small">Más emociones</span>
                    </button>
                </div>
            @endif
        </x-ui.card>
    </x-ui.section>

    <x-ui.section title="Resumen del día" :level="3">
        <x-ui.metric-grid label="Resumen del día">
            <x-ui.metric label="Último estado" :value="$moodEntries->first()?->emoji ?? '😶'"
                         :support="$moodEntries->first()?->text" />
            <x-ui.metric label="Energía promedio" icon="bi-lightning-charge" tone="warning"
                         :value="$avgEnergy ? number_format($avgEnergy, 1).'/5' : null" support="Sobre 5" />
        </x-ui.metric-grid>
    </x-ui.section>

    <x-ui.section title="Estados del día" :level="3">
        @if ($moodState === DataState::CONTENT)
            <x-ui.list label="Estados del día">
                @foreach ($moodEntries as $entry)
                    <x-ui.list-item :headline="$entry->text" wire:key="mood-entry-{{ $entry->id }}">
                        <x-slot:leading>
                            <span class="md-mood-entry__emoji" aria-hidden="true">{{ $entry->emoji }}</span>
                        </x-slot:leading>

                        @if ($entry->intensity)
                            <x-ui.chip variant="tonal">Intensidad {{ $entry->intensity }}/5</x-ui.chip>
                        @endif

                        @if ($entry->situation)
                            <p class="md-list-item-supporting">{{ $entry->situation }}</p>
                        @endif

                        @if ($entry->relationships->isNotEmpty())
                            <p class="md-list-item-supporting md-mood-entry__people">
                                <x-ui.icon name="bi-people" />
                                {{ $entry->relationships->map(fn ($person) => $person->displayName())->join(', ') }}
                            </p>
                        @endif

                        <p class="md-list-item-supporting">
                            {{ $entry->time }}
                            @if ($entry->reflection)
                                · <span class="md-label-small">{{ $entry->reflection->isCompleted() ? 'Reflexión completada' : 'Reflexión en borrador' }}</span>
                            @endif
                        </p>

                        <x-slot:trailing>
                            <x-ui.icon-action icon="bi-chat-left-text" label="Añadir contexto a {{ $entry->text }}"
                                              wire:click="openMoodContext('{{ $entry->id }}')" />
                            <x-ui.icon-action icon="bi-pencil" label="Cambiar la emoción {{ $entry->text }}"
                                              wire:click="openEditForm('{{ $entry->id }}')" />
                            <x-ui.icon-action icon="bi-lightbulb" label="Reflexionar sobre {{ $entry->text }}" tone="info"
                                              wire:click="openReflection('{{ $entry->id }}')" />
                            <x-ui.destructive-action label="Eliminar el registro de {{ $entry->text }}" :iconOnly="true"
                                                     action="deleteMood('{{ $entry->id }}')"
                                                     title="Eliminar registro"
                                                     message="El estado y su contexto se eliminan de forma permanente." />
                        </x-slot:trailing>
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
        @else
            <x-ui.state variant="empty" icon="bi-emoji-smile" title="Sin registros de estado"
                        message="Elige arriba cómo te sientes para empezar el día." />
        @endif
    </x-ui.section>

    <x-ui.section title="Energía del día" :level="3">
        @if ($energyState === DataState::CONTENT)
            <x-ui.list label="Energía del día">
                @foreach ($energyEntries as $entry)
                    <x-ui.list-item :headline="$entry->level.'/5'" :supporting="$entry->comment"
                                    wire:key="energy-entry-{{ $entry->id }}">
                        <x-slot:leading>
                            <span class="md-energy-scale" role="img" aria-label="Nivel {{ $entry->level }} de 5">
                                @for ($i = 1; $i <= 5; $i++)
                                    <i class="bi bi-lightning-charge-fill md-energy-scale__step {{ $i <= $entry->level ? 'is-filled' : '' }}" aria-hidden="true"></i>
                                @endfor
                            </span>
                        </x-slot:leading>

                        <p class="md-list-item-supporting">{{ $entry->time }}</p>

                        <x-slot:trailing>
                            <x-ui.destructive-action label="Eliminar el registro de energía" :iconOnly="true"
                                                     action="deleteEnergy('{{ $entry->id }}')"
                                                     title="Eliminar registro"
                                                     message="El registro de energía se elimina de forma permanente." />
                        </x-slot:trailing>
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
        @else
            <x-ui.state variant="empty" icon="bi-lightning-charge" title="Sin registros de energía"
                        message="Registra tu energía para ver cómo cambia durante el día.">
                <x-slot:actions>
                    <x-ui.action variant="outlined" icon="bi-lightning-charge" wire:click="openEnergyForm">Registrar energía</x-ui.action>
                </x-slot:actions>
            </x-ui.state>
        @endif
    </x-ui.section>

    @include('livewire.mood.partials.progressive')

    @if ($reflectionEntryId)
        @livewire('mood.mood-reflection-wizard', ['entryId' => $reflectionEntryId], key('reflection-'.$reflectionEntryId))
    @endif

    @if ($showEditForm)
        <div x-data="{ editing: true }">
            <x-ui.dialog state="editing" title="Cambiar la emoción" x-on:md-surface-close="$wire.closeEditForm()">
                <p class="md-body-small">Se conserva el contexto que ya registraste.</p>

                <div class="md-mood-catalog" role="group" aria-label="Catálogo de emociones">
                    @foreach ($moodStates as $state)
                        <button type="button" wire:click="updateMoodState('{{ $state->id }}')"
                                class="md-mood-catalog__item {{ $editMoodStateId === $state->id ? 'is-selected' : '' }}"
                                title="{{ $state->text }}" wire:key="edit-state-{{ $state->id }}">
                            <span class="md-mood-catalog__emoji" aria-hidden="true">{{ $state->emoji }}</span>
                            <span class="md-label-small">{{ $state->text }}</span>
                        </button>
                    @endforeach
                </div>

                <x-slot:actions>
                    <x-ui.action variant="text" wire:click="closeEditForm">Cancelar</x-ui.action>
                </x-slot:actions>
            </x-ui.dialog>
        </div>
    @endif

    <x-ui.dialog state="showEnergyDialog" title="Nivel de energía">
        <div class="md-energy-picker" role="group" aria-label="Nivel de energía">
            @for ($i = 1; $i <= 5; $i++)
                <button type="button" wire:click="$set('energyLevel', {{ $i }})"
                        class="md-btn-icon md-btn--lg md-energy-picker__step {{ $energyLevel >= $i ? 'is-filled' : '' }}"
                        aria-pressed="{{ $energyLevel >= $i ? 'true' : 'false' }}"
                        aria-label="Nivel {{ $i }} de 5">
                    <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
                </button>
            @endfor
        </div>

        <p class="md-headline-small md-energy-picker__value">{{ $energyLevel }}/5</p>

        <x-ui.field name="energyComment" label="Comentario (opcional)" wire:model="energyComment" />

        <x-slot:actions>
            <x-ui.action variant="text" x-on:click="showEnergyDialog = false">Cancelar</x-ui.action>
            <x-ui.action variant="filled" tone="warning" icon="bi-check-lg" wire:click="saveEnergy">Guardar</x-ui.action>
        </x-slot:actions>
    </x-ui.dialog>
</x-module-shell>
