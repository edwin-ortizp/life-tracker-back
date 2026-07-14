<x-module-shell module="meals" x-data="{ showDialog: $wire.entangle('showForm') }">
    <x-slot:actions>
        <div class="md-date-navigator"><button wire:click="previousWeek" class="md-btn-icon" aria-label="Semana anterior"><i class="bi bi-chevron-left"></i></button><button wire:click="thisWeek" class="md-date-navigator__today">Esta semana</button><span class="md-date-navigator__label">{{ $weekStart->format('d M') }} – {{ $weekStart->copy()->endOfWeek()->format('d M') }}</span><button wire:click="nextWeek" class="md-btn-icon" aria-label="Semana siguiente"><i class="bi bi-chevron-right"></i></button></div>
    </x-slot:actions>

    {{-- Weekly Grid --}}
    <div class="md-card-elevated" style="padding: 0; overflow-x: auto;">
        <table class="table table-bordered align-middle mb-0" style="border-color: var(--md-sys-color-outline-variant);">
            <thead>
                <tr style="background: var(--md-sys-color-surface-container-high);">
                    <th style="width: 100px; color: var(--md-sys-color-on-surface-variant); border-color: var(--md-sys-color-outline-variant);"></th>
                    @foreach ($weekDates as $date)
                        <th class="text-center" style="border-color: var(--md-sys-color-outline-variant); {{ $date->isToday() ? 'background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);' : 'color: var(--md-sys-color-on-surface);' }}">
                            <div class="md-label-small">{{ $date->translatedFormat('D') }}</div>
                            <div class="md-title-medium">{{ $date->format('d') }}</div>
                        </th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach ($mealTypes as $typeKey => $typeLabel)
                    <tr>
                        <td class="md-label-large" style="color: var(--md-sys-color-on-surface); border-color: var(--md-sys-color-outline-variant);">{{ $typeLabel }}</td>
                        @foreach ($weekDates as $date)
                            @php
                                $key = $date->format('Y-m-d') . '|' . $typeKey;
                                $entry = $entries->get($key)?->first();
                            @endphp
                            <td class="text-center p-1" style="cursor: pointer; min-width: 100px; border-color: var(--md-sys-color-outline-variant); {{ $date->isToday() ? 'background: color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent);' : '' }}"
                                wire:click="openForm('{{ $date->format('Y-m-d') }}', '{{ $typeKey }}')">
                                @if ($entry)
                                    <div class="md-label-medium text-truncate" style="max-width: 90px; color: var(--md-sys-color-on-surface);" title="{{ $entry->name }}">
                                        {{ $entry->name }}
                                    </div>
                                    @if ($entry->calories)
                                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $entry->calories }} kcal</span>
                                    @endif
                                @else
                                    <span class="md-label-medium" style="color: var(--md-sys-color-outline);">+</span>
                                @endif
                            </td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    {{-- Dialog --}}
    <template x-if="showDialog">
        <div>
            <div class="md-dialog-scrim" @click="showDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">
                    {{ $editingId ? 'Editar' : 'Agregar' }} - {{ $mealTypes[$formMealType] ?? $formMealType }}
                    <span class="md-body-medium d-block" style="color: var(--md-sys-color-on-surface-variant);">
                        {{ \Carbon\Carbon::parse($formDate)->translatedFormat('D d M') }}
                    </span>
                </h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <div class="md-text-field">
                            <input type="text" wire:model="formName" placeholder=" " id="meal-name">
                            <label for="meal-name">Comida</label>
                        </div>
                        <div class="row g-3">
                            <div class="col-8">
                                <div class="md-text-field">
                                    <input type="text" wire:model="formNotes" placeholder=" " id="meal-notes">
                                    <label for="meal-notes">Notas (opcional)</label>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="md-text-field">
                                    <input type="number" wire:model="formCalories" placeholder=" " id="meal-cal">
                                    <label for="meal-cal">Calorías</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="save" class="md-btn-filled" style="background: var(--md-custom-color-warning); color: var(--md-custom-color-on-warning);">
                        <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </div>
    </template>
</x-module-shell>
