<x-module-shell module="water" x-data="{ showDialog: @entangle('showForm') }">
    <x-slot:actions>
        <x-date-navigator :date="$selectedDate" format="D d M" />
        <x-module-actions :primary="['label' => 'Registrar', 'icon' => 'bi-plus-lg', 'action' => 'openForm']" />
    </x-slot:actions>

    {{-- Progress Card --}}
    <div class="md-card-elevated text-center mb-3" style="padding: 24px;">
        <div class="position-relative d-inline-block mb-3">
            <div style="width: 120px; height: 120px;" class="position-relative">
                <svg viewBox="0 0 120 120" style="transform: rotate(-90deg);">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="var(--md-sys-color-surface-container-highest)" stroke-width="10"/>
                    <circle cx="60" cy="60" r="54" fill="none" stroke="var(--md-sys-color-primary)" stroke-width="10"
                            stroke-dasharray="{{ 2 * 3.14159 * 54 }}"
                            stroke-dashoffset="{{ 2 * 3.14159 * 54 * (1 - $percentage / 100) }}"
                            stroke-linecap="round"/>
                </svg>
                <div class="position-absolute top-50 start-50 translate-middle text-center">
                    <i class="bi bi-droplet-fill" style="font-size: 1.5rem; color: var(--md-sys-color-primary);"></i>
                </div>
            </div>
        </div>
        <div class="md-headline-small" style="color: var(--md-sys-color-primary);">{{ number_format($totalHydration) }} ml</div>
        <div class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant);">de {{ number_format($dailyGoal) }} ml</div>
        <div class="md-progress-linear mt-3 mx-auto" style="max-width: 300px;">
            <div class="md-progress-linear-bar" style="width: {{ $percentage }}%"></div>
        </div>
        <span class="md-label-small mt-2 d-block" style="color: var(--md-sys-color-on-surface-variant);">{{ number_format($percentage, 0) }}% completado</span>
    </div>

    {{-- Quick Add --}}
    <div class="md-card-outlined mb-3">
        <h3 class="md-title-small mb-3" style="color: var(--md-sys-color-on-surface);">
            <i class="bi bi-lightning-charge" style="color: var(--md-custom-color-warning);"></i> Agregar Rápido
        </h3>
        <div class="d-flex flex-wrap gap-2">
            @foreach ($drinkTypes->take(6) as $type)
                <button wire:click="quickAdd('{{ $type->id }}', 250)" class="md-btn-tonal" style="height: 32px; padding: 0 14px; font-size: 0.8125rem;">
                    {{ $type->icon ?? '💧' }} {{ $type->name }} (250ml)
                </button>
            @endforeach
        </div>
    </div>

    {{-- Today's Log --}}
    <div class="md-card-elevated" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px 16px 8px 16px;">
            <h3 class="md-title-small mb-0" style="color: var(--md-sys-color-on-surface);">
                <i class="bi bi-clock-history" style="color: var(--md-sys-color-on-surface-variant);"></i> Registro del día
            </h3>
        </div>
        @forelse ($logs as $log)
            <div class="md-list-item">
                <div class="md-list-item-leading">
                    <span class="md-chip-tonal md-chip-tonal--primary" style="font-size: 0.6875rem;">{{ $log->time }}</span>
                </div>
                <div class="md-list-item-content">
                    <div class="md-list-item-headline">{{ $log->drink_type }}</div>
                    <div class="md-list-item-supporting">{{ $log->amount }} ml · {{ $log->hydration_value }} ml hidratación</div>
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
                <i class="bi bi-droplet" style="font-size: 3rem; opacity: 0.4;"></i>
                <p class="md-body-large mt-3 mb-0">Sin registros para este día</p>
            </div>
        @endforelse
    </div>

    <x-slot:rail>
            <x-context-widget title="{{ $monthData['label'] }}" icon="bi-calendar3">
                @include('livewire.water.partials.month-calendar')
                <a href="{{ route('water.calendar', ['date' => $selectedDate]) }}" class="md-btn-text w-100 mt-2">Abrir calendario</a>
            </x-context-widget>
            <x-context-widget title="Ritmo mensual" icon="bi-activity" tone="success">
                <dl class="md-context-list"><div><dt>Meta alcanzada</dt><dd>{{ $monthData['completed_days'] }} días</dd></div><div><dt>Promedio</dt><dd>{{ number_format($monthData['average']) }} ml</dd></div></dl>
            </x-context-widget>
    </x-slot:rail>

    {{-- Dialog --}}
    <template x-if="showDialog">
        <div>
            <div class="md-dialog-scrim" @click="showDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">{{ $editingId ? 'Editar' : 'Nueva' }} Bebida</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <div class="md-text-field">
                            <select wire:model="drinkTypeId" id="water-type">
                                <option value="">Seleccionar...</option>
                                @foreach ($drinkTypes as $type)
                                    <option value="{{ $type->id }}">{{ $type->icon ?? '💧' }} {{ $type->name }} (x{{ $type->hydration_factor }})</option>
                                @endforeach
                            </select>
                            <label for="water-type">Tipo de bebida</label>
                        </div>
                        <div class="md-text-field">
                            <input type="number" wire:model="amount" placeholder=" " id="water-amount" min="1" step="50">
                            <label for="water-amount">Cantidad (ml)</label>
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                            @foreach ([100, 200, 250, 330, 500] as $preset)
                                <button wire:click="$set('amount', {{ $preset }})" class="md-btn-outlined" style="height: 32px; padding: 0 14px; font-size: 0.8125rem;">
                                    {{ $preset }}ml
                                </button>
                            @endforeach
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

    @if ($showCatalog)
        <div class="md-dialog-backdrop" wire:click.self="closeCatalog">
            <div class="md-dialog" style="max-width: 720px;">
                <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                        <h2 class="md-title-large mb-1">Configuración de bebidas</h2>
                        <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">Administra las bebidas disponibles para registrar tu hidratación.</p>
                    </div>
                    <button wire:click="closeCatalog" class="md-btn-icon" title="Cerrar"><i class="bi bi-x-lg"></i></button>
                </div>

                @if ($catalogMessage)
                    <div class="md-card-outlined mb-3 py-2 px-3 md-body-medium" style="border-color: var(--md-sys-color-primary);">{{ $catalogMessage }}</div>
                @endif

                <div class="d-flex justify-content-between align-items-center gap-2 mb-3">
                    <span class="md-title-small">Tus bebidas</span>
                    <button wire:click="openDrinkTypeForm" class="md-btn-filled"><i class="bi bi-plus-lg"></i> Nueva bebida</button>
                </div>

                <div class="d-flex flex-column gap-2">
                    @forelse ($drinkTypes as $type)
                        <div class="md-card-outlined d-flex align-items-center gap-3 py-2 px-3">
                            <span style="font-size: 1.5rem;">{{ $type->icon ?: '💧' }}</span>
                            <div class="flex-grow-1">
                                <div class="md-title-small">{{ $type->name }}</div>
                                <div class="md-body-small" style="color: var(--md-sys-color-on-surface-variant);">Factor de hidratación: {{ $type->hydration_factor }}</div>
                            </div>
                            <button wire:click="openDrinkTypeForm('{{ $type->id }}')" class="md-btn-icon" title="Editar"><i class="bi bi-pencil"></i></button>
                            <button wire:click="deleteDrinkType('{{ $type->id }}')" wire:confirm="¿Eliminar esta bebida?" class="md-btn-icon" title="Eliminar" style="color: var(--md-sys-color-error);"><i class="bi bi-trash"></i></button>
                        </div>
                    @empty
                        <div class="md-card-outlined text-center py-4" style="color: var(--md-sys-color-on-surface-variant);">Aún no tienes bebidas configuradas.</div>
                    @endforelse
                </div>
            </div>
        </div>
    @endif

    @if ($showDrinkTypeForm)
        <div class="md-dialog-backdrop" style="z-index: 1100;" wire:click.self="closeDrinkTypeForm">
            <div class="md-dialog" style="max-width: 520px;">
                <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
                    <h2 class="md-title-large mb-0">{{ $editingDrinkTypeId ? 'Editar bebida' : 'Nueva bebida' }}</h2>
                    <button wire:click="closeDrinkTypeForm" class="md-btn-icon" title="Cerrar"><i class="bi bi-x-lg"></i></button>
                </div>
                <div class="d-flex flex-column gap-3">
                    <div>
                        <label for="catalog-drink-name" class="form-label">Nombre</label>
                        <input wire:model="catalogDrinkName" id="catalog-drink-name" class="form-control" maxlength="255" placeholder="Ej. Agua con limón">
                        @error('catalogDrinkName') <small class="text-danger">{{ $message }}</small> @enderror
                    </div>
                    <div>
                        <label for="catalog-drink-icon" class="form-label">Icono</label>
                        <input wire:model="catalogDrinkIcon" id="catalog-drink-icon" class="form-control" maxlength="40" placeholder="💧">
                        @error('catalogDrinkIcon') <small class="text-danger">{{ $message }}</small> @enderror
                    </div>
                    <div>
                        <label for="catalog-hydration-factor" class="form-label">Factor de hidratación</label>
                        <input wire:model="catalogHydrationFactor" id="catalog-hydration-factor" type="number" min="0" max="9.99" step="0.01" class="form-control">
                        <div class="form-text">1,00 equivale a la misma cantidad de hidratación registrada.</div>
                        @error('catalogHydrationFactor') <small class="text-danger">{{ $message }}</small> @enderror
                    </div>
                </div>
                <div class="d-flex justify-content-end gap-2 mt-4">
                    <button wire:click="closeDrinkTypeForm" class="md-btn-text">Cancelar</button>
                    <button wire:click="saveDrinkType" class="md-btn-filled">Guardar bebida</button>
                </div>
            </div>
        </div>
    @endif
</x-module-shell>
