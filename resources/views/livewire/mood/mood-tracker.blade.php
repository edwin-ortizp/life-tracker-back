<x-module-shell module="mood" x-data="{ showMoodDialog: $wire.entangle('showMoodForm'), showEnergyDialog: $wire.entangle('showEnergyForm') }">
    <x-slot:actions>
        <x-date-navigator :date="$selectedDate" format="D d M" />
        <x-module-actions
            :primary="['label' => 'Registrar estado', 'icon' => 'bi-emoji-smile', 'action' => 'openMoodForm']"
            :secondary="[
                ['label' => 'Registrar energía', 'icon' => 'bi-lightning-charge', 'action' => 'openEnergyForm'],
                ['label' => 'Escribir en el diario', 'icon' => 'bi-journal-text', 'href' => route('journal', ['date' => $selectedDate])],
            ]" />
    </x-slot:actions>

    {{-- Quick Summary --}}
    <div class="row g-3 mb-3">
        <div class="col-6">
            <div class="md-card-elevated text-center" style="height: 100%;">
                <div style="font-size: 2.5rem; margin-bottom: 8px;">{{ $moodEntries->first()?->emoji ?? '😶' }}</div>
                <span class="md-label-medium" style="color: var(--md-sys-color-on-surface-variant);">Último estado</span>
            </div>
        </div>
        <div class="col-6">
            <div class="md-card-elevated text-center" style="height: 100%;">
                <div class="md-headline-small" style="color: var(--md-custom-color-warning);">
                    <i class="bi bi-lightning-charge"></i>
                    {{ $avgEnergy ? number_format($avgEnergy, 1) : '-' }}/5
                </div>
                <span class="md-label-medium" style="color: var(--md-sys-color-on-surface-variant);">Energía promedio</span>
            </div>
        </div>
    </div>

    {{-- Mood Entries --}}
    <div class="md-card-elevated mb-3" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px 16px 8px 16px;">
            <h3 class="md-title-small mb-0" style="color: var(--md-sys-color-on-surface);">
                <i class="bi bi-emoji-smile" style="color: var(--md-sys-color-on-surface-variant);"></i> Estados del día
            </h3>
        </div>
        @forelse ($moodEntries as $entry)
            <div class="md-list-item">
                <div class="md-list-item-leading">
                    <span style="font-size: 1.5rem;">{{ $entry->emoji }}</span>
                </div>
                <div class="md-list-item-content">
                    <div class="md-list-item-headline">{{ $entry->text }}</div>
                    <div class="md-list-item-supporting">{{ $entry->time }}</div>
                </div>
                <div class="md-list-item-trailing">
                    <button wire:click="deleteMood('{{ $entry->id }}')" wire:confirm="¿Eliminar este registro?" class="md-btn-icon" style="color: var(--md-sys-color-error);">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        @empty
            <div class="text-center py-4" style="color: var(--md-sys-color-on-surface-variant);">
                <p class="md-body-medium mb-0">Sin registros de estado</p>
            </div>
        @endforelse
    </div>

    {{-- Energy Entries --}}
    <div class="md-card-elevated" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px 16px 8px 16px;">
            <h3 class="md-title-small mb-0" style="color: var(--md-sys-color-on-surface);">
                <i class="bi bi-lightning-charge" style="color: var(--md-custom-color-warning);"></i> Energía del día
            </h3>
        </div>
        @forelse ($energyEntries as $entry)
            <div class="md-list-item">
                <div class="md-list-item-leading">
                    <div class="d-flex gap-1">
                        @for ($i = 1; $i <= 5; $i++)
                            <i class="bi bi-lightning-charge-fill" style="color: {{ $i <= $entry->level ? 'var(--md-custom-color-warning)' : 'var(--md-sys-color-outline-variant)' }}; font-size: 0.75rem;"></i>
                        @endfor
                    </div>
                </div>
                <div class="md-list-item-content">
                    <div class="md-list-item-headline">{{ $entry->level }}/5</div>
                    @if ($entry->comment)
                        <div class="md-list-item-supporting">{{ $entry->comment }}</div>
                    @endif
                    <div class="md-list-item-supporting">{{ $entry->time }}</div>
                </div>
                <div class="md-list-item-trailing">
                    <button wire:click="deleteEnergy('{{ $entry->id }}')" wire:confirm="¿Eliminar este registro?" class="md-btn-icon" style="color: var(--md-sys-color-error);">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        @empty
            <div class="text-center py-4" style="color: var(--md-sys-color-on-surface-variant);">
                <p class="md-body-medium mb-0">Sin registros de energía</p>
            </div>
        @endforelse
    </div>

    {{-- Mood Dialog --}}
    <template x-if="showMoodDialog">
        <div>
            <div class="md-dialog-scrim" @click="showMoodDialog = false"></div>
            <div class="md-dialog" @click.stop style="max-width: 480px;">
                <h2 class="md-dialog-headline md-headline-small">¿Cómo te sientes?</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-wrap gap-2 justify-content-center">
                        @foreach ($moodStates as $state)
                            <button wire:click="saveMood('{{ $state->id }}')"
                                    class="md-card-outlined text-center"
                                    style="width: 80px; padding: 12px 8px; cursor: pointer; border: 1px solid var(--md-sys-color-outline-variant);"
                                    title="{{ $state->text }}">
                                <div style="font-size: 1.75rem;">{{ $state->emoji }}</div>
                                <span class="md-label-small d-block text-truncate" style="color: var(--md-sys-color-on-surface-variant);">{{ $state->text }}</span>
                            </button>
                        @endforeach
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showMoodDialog = false" class="md-btn-text">Cancelar</button>
                </div>
            </div>
        </div>
    </template>

    {{-- Energy Dialog --}}
    <template x-if="showEnergyDialog">
        <div>
            <div class="md-dialog-scrim" @click="showEnergyDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">Nivel de Energía</h2>
                <div class="md-dialog-content">
                    <div class="d-flex justify-content-center gap-2 mb-3">
                        @for ($i = 1; $i <= 5; $i++)
                            <button wire:click="$set('energyLevel', {{ $i }})"
                                    class="md-btn-icon"
                                    style="width: 48px; height: 48px; {{ $energyLevel >= $i ? 'background: var(--md-custom-color-warning-container); color: var(--md-custom-color-on-warning-container);' : '' }}">
                                <i class="bi bi-lightning-charge-fill"></i>
                            </button>
                        @endfor
                    </div>
                    <div class="text-center mb-3">
                        <span class="md-headline-small" style="color: var(--md-custom-color-warning);">{{ $energyLevel }}/5</span>
                    </div>
                    <div class="md-text-field">
                        <input type="text" wire:model="energyComment" placeholder=" " id="energy-comment">
                        <label for="energy-comment">Comentario (opcional)</label>
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showEnergyDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="saveEnergy" class="md-btn-filled" style="background: var(--md-custom-color-warning); color: var(--md-custom-color-on-warning);">
                        <i class="bi bi-check-lg"></i> Guardar
                    </button>
                </div>
            </div>
        </div>
    </template>
</x-module-shell>
