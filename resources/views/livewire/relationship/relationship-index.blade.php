<x-module-shell module="relationships" x-data="{ showPersonDialog: $wire.entangle('showForm'), showCircleDialog: $wire.entangle('showCircleForm') }">
    <x-slot:actions>
        <x-module-actions
            :primary="['label' => 'Nueva persona', 'icon' => 'bi-person-plus', 'action' => 'openForm']"
            :secondary="[['label' => 'Nuevo círculo', 'icon' => 'bi-plus-circle', 'action' => 'openCircleForm']]" />
    </x-slot:actions>

    <div class="md-summary-strip mb-3" aria-label="Resumen de relaciones">
        <span class="md-count-badge--info">{{ $totalCount }} personas</span>
    </div>

    {{-- Filters --}}
    <div class="md-card-filled mb-3">
        <div class="d-flex flex-wrap gap-3 align-items-center">
            <div class="md-text-field" style="width: auto; min-width: 160px;">
                <select wire:model.live="circleFilter" id="rel-circle">
                    <option value="">Todos</option>
                    @foreach ($circles as $circle)
                        <option value="{{ $circle->id }}">{{ $circle->name }}</option>
                    @endforeach
                </select>
                <label for="rel-circle">Círculo</label>
            </div>
            <label class="md-checkbox">
                <input type="checkbox" wire:model.live="showArchived">
                Mostrar archivados
            </label>
        </div>
    </div>

    {{-- Relationships List --}}
    @forelse ($relationships as $rel)
        <div class="md-card-outlined mb-2" style="{{ $rel->is_archived ? 'opacity: 0.5;' : '' }}">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-3">
                    <div class="md-list-icon-circle" style="background: var(--md-custom-color-info-container); color: var(--md-custom-color-on-info-container);">
                        <i class="bi bi-person-fill" style="font-size: 1rem;"></i>
                    </div>
                    <div>
                        <div class="md-title-small" style="color: var(--md-sys-color-on-surface);">{{ $rel->full_name }}</div>
                        <div class="d-flex flex-wrap gap-1 mt-1">
                            @if ($rel->circle)
                                <span class="md-chip-tonal md-chip-tonal--info">{{ $rel->circle->name }}</span>
                            @endif
                            @if ($rel->category)
                                <span class="md-chip-tonal">{{ $rel->category }}</span>
                            @endif
                            @if ($rel->birthday_month && $rel->birthday_day)
                                <span class="md-chip-tonal md-chip-tonal--warning">
                                    <i class="bi bi-cake2" style="font-size: 0.5625rem;"></i> {{ $rel->birthday_day }}/{{ $rel->birthday_month }}
                                </span>
                            @endif
                            @if ($rel->last_contact_at)
                                <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant); align-self: center;">{{ $rel->last_contact_at->diffForHumans() }}</span>
                            @endif
                        </div>
                    </div>
                </div>
                <div class="d-flex gap-1">
                    <button wire:click="markContact('{{ $rel->id }}')" class="md-btn-icon" title="Marcar contacto" style="color: var(--md-custom-color-success);">
                        <i class="bi bi-chat-dots"></i>
                    </button>
                    <button wire:click="openForm('{{ $rel->id }}')" class="md-btn-icon" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button wire:click="toggleArchive('{{ $rel->id }}')" class="md-btn-icon" title="{{ $rel->is_archived ? 'Desarchivar' : 'Archivar' }}" style="color: var(--md-custom-color-warning);">
                        <i class="bi bi-archive"></i>
                    </button>
                    <button wire:click="delete('{{ $rel->id }}')" wire:confirm="¿Eliminar esta persona?" class="md-btn-icon" style="color: var(--md-sys-color-error);">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    @empty
        <div class="text-center py-5" style="color: var(--md-sys-color-on-surface-variant);">
            <i class="bi bi-people" style="font-size: 3rem; opacity: 0.4;"></i>
            <p class="md-body-large mt-3 mb-0">Sin personas registradas</p>
        </div>
    @endforelse

    {{-- Circle Dialog --}}
    <template x-if="showCircleDialog">
        <div>
            <div class="md-dialog-scrim" @click="showCircleDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">Nuevo Círculo</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <div class="md-text-field">
                            <input type="text" wire:model="circleName" placeholder=" " id="circle-name">
                            <label for="circle-name">Nombre del círculo</label>
                        </div>
                        <div class="md-text-field">
                            <input type="number" wire:model="contactFrequencyDays" placeholder=" " id="circle-freq" min="1">
                            <label for="circle-freq">Frecuencia (días)</label>
                        </div>
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showCircleDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="saveCircle" class="md-btn-filled">
                        <i class="bi bi-check-lg"></i> Crear
                    </button>
                </div>
            </div>
        </div>
    </template>

    {{-- Person Dialog --}}
    <template x-if="showPersonDialog">
        <div>
            <div class="md-dialog-scrim" @click="showPersonDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">{{ $editingId ? 'Editar' : 'Nueva' }} Persona</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <div class="row g-3">
                            <div class="col-7">
                                <div class="md-text-field">
                                    <input type="text" wire:model="fullName" placeholder=" " id="rel-name">
                                    <label for="rel-name">Nombre completo</label>
                                </div>
                            </div>
                            <div class="col-5">
                                <div class="md-text-field">
                                    <input type="text" wire:model="nickname" placeholder=" " id="rel-nick">
                                    <label for="rel-nick">Apodo</label>
                                </div>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="md-text-field">
                                    <select wire:model="circleId" id="rel-circle-sel">
                                        <option value="">Sin círculo</option>
                                        @foreach ($circles as $circle)
                                            <option value="{{ $circle->id }}">{{ $circle->name }}</option>
                                        @endforeach
                                    </select>
                                    <label for="rel-circle-sel">Círculo</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="md-text-field">
                                    <select wire:model="category" id="rel-cat">
                                        <option value="">Sin categoría</option>
                                        <option value="familia">Familia</option>
                                        <option value="amigo">Amigo</option>
                                        <option value="trabajo">Trabajo</option>
                                        <option value="pareja">Pareja</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                    <label for="rel-cat">Categoría</label>
                                </div>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="md-text-field">
                                    <select wire:model="birthdayMonth" id="rel-bm">
                                        <option value="">-</option>
                                        @for ($m = 1; $m <= 12; $m++)
                                            <option value="{{ $m }}">{{ \Carbon\Carbon::create(2000, $m, 1)->translatedFormat('F') }}</option>
                                        @endfor
                                    </select>
                                    <label for="rel-bm">Mes cumpleaños</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="md-text-field">
                                    <input type="number" wire:model="birthdayDay" placeholder=" " id="rel-bd" min="1" max="31">
                                    <label for="rel-bd">Día</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showPersonDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="save" class="md-btn-filled">
                        <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </div>
    </template>
</x-module-shell>
