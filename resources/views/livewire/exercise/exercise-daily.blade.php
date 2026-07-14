<x-module-shell module="exercise" x-data="{ showDialog: $wire.entangle('showForm') }">
    <x-slot:actions>
        <x-date-navigator :date="$selectedDate" format="D d M" />
        <x-module-actions :primary="['label' => 'Registrar ejercicio', 'icon' => 'bi-plus-lg', 'action' => 'openForm']" />
    </x-slot:actions>

    {{-- Daily Stats --}}
    <div class="row g-3 mb-3">
        <div class="col-4">
            <div class="md-card-filled text-center" style="height: 100%;">
                <div class="md-card-icon mx-auto mb-1" style="background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); width: 40px; height: 40px;">
                    <i class="bi bi-fire" style="font-size: 1.125rem;"></i>
                </div>
                <div class="md-title-large" style="color: var(--md-sys-color-error);">{{ number_format($totalCalories) }}</div>
                <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">kcal</span>
            </div>
        </div>
        <div class="col-4">
            <div class="md-card-filled text-center" style="height: 100%;">
                <div class="md-card-icon mx-auto mb-1" style="background: var(--md-custom-color-info-container); color: var(--md-custom-color-on-info-container); width: 40px; height: 40px;">
                    <i class="bi bi-clock" style="font-size: 1.125rem;"></i>
                </div>
                <div class="md-title-large" style="color: var(--md-custom-color-info);">{{ $totalDuration }}</div>
                <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">min</span>
            </div>
        </div>
        <div class="col-4">
            <div class="md-card-filled text-center" style="height: 100%;">
                <div class="md-card-icon mx-auto mb-1" style="background: var(--md-custom-color-success-container); color: var(--md-custom-color-on-success-container); width: 40px; height: 40px;">
                    <i class="bi bi-signpost-2" style="font-size: 1.125rem;"></i>
                </div>
                <div class="md-title-large" style="color: var(--md-custom-color-success);">{{ number_format($totalSteps) }}</div>
                <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">pasos</span>
            </div>
        </div>
    </div>

    {{-- Exercise Log --}}
    <div class="md-card-elevated" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px 16px 8px 16px;">
            <h3 class="md-title-small mb-0" style="color: var(--md-sys-color-on-surface);">
                <i class="bi bi-list-ul" style="color: var(--md-sys-color-on-surface-variant);"></i> Actividades del día
            </h3>
        </div>
        @forelse ($logs as $log)
            <div class="md-list-item">
                <div class="md-list-item-leading">
                    <div class="md-list-icon-circle" style="background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container);">
                        <span style="font-size: 1rem;">{{ $log->exerciseType?->icon ?? '🏃' }}</span>
                    </div>
                </div>
                <div class="md-list-item-content">
                    <div class="md-list-item-headline">{{ $log->exerciseType?->name ?? 'Ejercicio' }}</div>
                    <div class="md-list-item-supporting">
                        @if ($log->duration) {{ $log->duration }} min @endif
                        @if ($log->calories) · {{ $log->calories }} kcal @endif
                        @if ($log->sets && $log->reps) · {{ $log->sets }}x{{ $log->reps }} @endif
                        @if ($log->weight) · {{ $log->weight }}kg @endif
                        @if ($log->distance) · {{ $log->distance }}km @endif
                        @if ($log->steps) · {{ number_format($log->steps) }} pasos @endif
                    </div>
                    @if ($log->notes)
                        <div class="md-list-item-supporting" style="font-style: italic;">{{ $log->notes }}</div>
                    @endif
                </div>
                <div class="md-list-item-trailing">
                    <button wire:click="openForm('{{ $log->id }}')" class="md-btn-icon" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button wire:click="delete('{{ $log->id }}')" wire:confirm="¿Eliminar este registro?" class="md-btn-icon" title="Eliminar" style="color: var(--md-sys-color-error);">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        @empty
            <div class="text-center py-5" style="color: var(--md-sys-color-on-surface-variant);">
                <i class="bi bi-activity" style="font-size: 3rem; opacity: 0.4;"></i>
                <p class="md-body-large mt-3 mb-0">Sin ejercicios registrados</p>
            </div>
        @endforelse
    </div>

    {{-- Dialog --}}
    <template x-if="showDialog">
        <div>
            <div class="md-dialog-scrim" @click="showDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">{{ $editingId ? 'Editar' : 'Nuevo' }} Ejercicio</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <div class="md-text-field">
                            <select wire:model.live="exerciseTypeId" id="ex-type">
                                <option value="">Seleccionar...</option>
                                @foreach ($exerciseTypes as $type)
                                    <option value="{{ $type->id }}">{{ $type->icon ?? '🏃' }} {{ $type->name }}</option>
                                @endforeach
                            </select>
                            <label for="ex-type">Tipo de ejercicio</label>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="md-text-field">
                                    <input type="number" wire:model.live="duration" placeholder=" " id="ex-dur" min="0">
                                    <label for="ex-dur">Duración (min)</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="md-text-field">
                                    <input type="number" wire:model="calories" placeholder=" " id="ex-cal" min="0">
                                    <label for="ex-cal">Calorías</label>
                                </div>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-4">
                                <div class="md-text-field">
                                    <input type="number" wire:model="sets" placeholder=" " id="ex-sets" min="0">
                                    <label for="ex-sets">Series</label>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="md-text-field">
                                    <input type="number" wire:model="reps" placeholder=" " id="ex-reps" min="0">
                                    <label for="ex-reps">Reps</label>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="md-text-field">
                                    <input type="number" wire:model="weight" placeholder=" " id="ex-weight" min="0" step="0.5">
                                    <label for="ex-weight">Peso (kg)</label>
                                </div>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="md-text-field">
                                    <input type="number" wire:model="distance" placeholder=" " id="ex-dist" min="0" step="0.1">
                                    <label for="ex-dist">Distancia (km)</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="md-text-field">
                                    <input type="number" wire:model="steps" placeholder=" " id="ex-steps" min="0">
                                    <label for="ex-steps">Pasos</label>
                                </div>
                            </div>
                        </div>
                        <div class="md-text-field">
                            <input type="text" wire:model="notes" placeholder=" " id="ex-notes">
                            <label for="ex-notes">Notas (opcional)</label>
                        </div>
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="save" class="md-btn-filled">
                        <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </div>
    </template>
</x-module-shell>
