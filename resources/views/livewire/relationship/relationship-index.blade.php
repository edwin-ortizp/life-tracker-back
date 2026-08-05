<x-module-shell module="relationships" x-data="{
    showPersonDialog: $wire.entangle('showForm'),
    showCircleDialog: $wire.entangle('showCircleForm'),
    showTagDialog: $wire.entangle('showTagForm'),
}">
    <x-slot:actions>
        <x-module-actions
            :primary="['label' => 'Nueva persona', 'icon' => 'bi-person-plus', 'action' => 'openForm']"
            :secondary="[
                ['label' => 'Nuevo círculo', 'icon' => 'bi-plus-circle', 'action' => 'openCircleForm'],
                ['label' => 'Nueva etiqueta', 'icon' => 'bi-tag', 'action' => 'openTagForm'],
            ]" />
    </x-slot:actions>

    <div class="md-summary-strip mb-3" aria-label="Resumen de relaciones">
        <span class="md-count-badge--info">{{ $activeCount }} activas</span>
        @if ($archivedCount)
            <span class="md-count-badge--primary">{{ $archivedCount }} archivadas</span>
        @endif
        @if ($dueFollowUps->isNotEmpty())
            <span class="md-count-badge--warning">{{ $dueFollowUps->count() }} por contactar</span>
        @endif
    </div>

    {{-- Search and filters --}}
    <x-ui.filter-bar search="search" placeholder="Buscar por nombre, apodo, teléfono o correo..." label="Filtros de relaciones">
        <x-slot:chips>

        
            <button wire:click="$toggle('showArchived')"
                    class="md-chip md-chip-filter {{ $showArchived ? 'selected' : '' }}">
                <i class="bi bi-archive"></i> Archivadas
            </button>

            <div class="md-chip-rail__divider"></div>

            <div class="md-chip-menu" :class="{ 'open': openMenu === 'circle' }">
                <button @click="openMenu = openMenu === 'circle' ? null : 'circle'"
                        class="md-chip md-chip-filter {{ $circleFilter ? 'selected' : '' }}">
                    {{ $circleFilter ? $circles->firstWhere('id', $circleFilter)?->name : 'Círculo' }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'circle'" x-transition x-cloak class="md-chip-menu__dropdown">
                    <button wire:click="$set('circleFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $circleFilter === '' ? 'active' : '' }}">Todos</button>
                    @foreach ($circles as $circle)
                        <button wire:click="$set('circleFilter', '{{ $circle->id }}')" @click="openMenu = null"
                                class="md-chip-menu__item {{ $circleFilter === $circle->id ? 'active' : '' }}">{{ $circle->name }}</button>
                    @endforeach
                </div>
            </div>

            <div class="md-chip-menu" :class="{ 'open': openMenu === 'tag' }">
                <button @click="openMenu = openMenu === 'tag' ? null : 'tag'"
                        class="md-chip md-chip-filter {{ $tagFilter ? 'selected' : '' }}">
                    {{ $tagFilter ? $tags->firstWhere('id', $tagFilter)?->name : 'Etiqueta' }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'tag'" x-transition x-cloak class="md-chip-menu__dropdown">
                    <button wire:click="$set('tagFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $tagFilter === '' ? 'active' : '' }}">Todas</button>
                    @foreach ($tags as $tag)
                        <button wire:click="$set('tagFilter', '{{ $tag->id }}')" @click="openMenu = null"
                                class="md-chip-menu__item {{ $tagFilter === $tag->id ? 'active' : '' }}">{{ $tag->name }}</button>
                    @endforeach
                </div>
            </div>
        </x-slot:chips>
    </x-ui.filter-bar>

    {{-- Relationships list --}}
    @forelse ($relationships as $rel)
        @php($birthday = $rel->birthday())
        <div class="md-card-outlined md-relationship-card mb-2 {{ $rel->is_archived ? 'md-relationship-card--archived' : '' }}">
            <div class="d-flex align-items-center justify-content-between gap-2">
                <a href="{{ route('relationships.show', $rel) }}" class="md-relationship-card__link d-flex align-items-center gap-3" wire:navigate>
                    <div class="md-list-icon-circle" style="background: var(--md-custom-color-info-container); color: var(--md-custom-color-on-info-container);">
                        <i class="bi bi-person-fill" style="font-size: 1rem;"></i>
                    </div>
                    <div>
                        <div class="md-title-small" style="color: var(--md-sys-color-on-surface);">
                            {{ $rel->full_name }}
                            @if ($rel->nickname)
                                <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">· {{ $rel->nickname }}</span>
                            @endif
                        </div>
                        <div class="d-flex flex-wrap gap-1 mt-1">
                            @if ($rel->circle)
                                <span class="md-chip-tonal md-chip-tonal--info">{{ $rel->circle->name }}</span>
                            @endif
                            @foreach ($rel->tags as $tag)
                                <span class="md-chip-tonal">{{ $tag->name }}</span>
                            @endforeach
                            @if ($birthday)
                                <span class="md-chip-tonal md-chip-tonal--warning">
                                    <i class="bi bi-cake2" style="font-size: 0.5625rem;"></i> {{ $birthday->label() }}
                                </span>
                            @endif
                            @if ($rel->isFollowUpDue())
                                <span class="md-chip-tonal md-chip-tonal--warning">
                                    <i class="bi bi-exclamation-circle" style="font-size: 0.5625rem;"></i> Por contactar
                                </span>
                            @endif
                            @foreach ($rel->contactMethods->take(2) as $method)
                                <span class="md-label-small md-relationship-card__contact">
                                    <i class="bi {{ $method->type === 'email' ? 'bi-envelope' : ($method->type === 'phone' ? 'bi-telephone' : 'bi-link-45deg') }}"></i>
                                    {{ $method->value }}
                                </span>
                            @endforeach
                        </div>
                    </div>
                </a>
                <div class="d-flex gap-1">
                    <button wire:click="markContact('{{ $rel->id }}')" class="md-btn-icon" title="Marcar contacto" style="color: var(--md-custom-color-success);">
                        <i class="bi bi-chat-dots"></i>
                    </button>
                    <button wire:click="openForm('{{ $rel->id }}')" class="md-btn-icon" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button wire:click="toggleArchive('{{ $rel->id }}')" class="md-btn-icon" title="{{ $rel->is_archived ? 'Desarchivar' : 'Archivar' }}" style="color: var(--md-custom-color-warning);">
                        <i class="bi {{ $rel->is_archived ? 'bi-archive-fill' : 'bi-archive' }}"></i>
                    </button>
                    <button wire:click="delete('{{ $rel->id }}')"
                            wire:confirm="Se eliminará el perfil de {{ $rel->full_name }} y sus acontecimientos. Las tareas asociadas se conservarán. ¿Continuar?"
                            class="md-btn-icon" title="Eliminar" style="color: var(--md-sys-color-error);">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    @empty
        <x-empty-state icon="bi-people" title="{{ $showArchived ? 'Sin relaciones archivadas' : 'Sin personas registradas' }}"
                       message="Agrega a las personas que quieres recordar y cuidar." />
    @endforelse

    @if ($relationships->hasPages())
        <div class="mt-3">{{ $relationships->links() }}</div>
    @endif

    <x-slot:rail>
        <x-context-widget title="Resumen" icon="bi-people" tone="success">
            <dl class="md-context-list">
                <div><dt>Activas</dt><dd>{{ $activeCount }}</dd></div>
                <div><dt>Archivadas</dt><dd>{{ $archivedCount }}</dd></div>
                <div><dt>Círculos</dt><dd>{{ $circles->count() }}</dd></div>
                <div><dt>Etiquetas</dt><dd>{{ $tags->count() }}</dd></div>
            </dl>
        </x-context-widget>

        @if ($nextBirthdays->isNotEmpty())
            <x-context-widget title="Próximos cumpleaños" icon="bi-cake2" tone="warning">
                <dl class="md-context-list">
                    @foreach ($nextBirthdays as $row)
                        <div>
                            <dt>{{ $row['relationship']->displayName() }}</dt>
                            <dd>{{ $row['birthday']->isToday() ? 'Hoy' : 'en '.$row['birthday']->daysUntil().' días' }}</dd>
                        </div>
                    @endforeach
                </dl>
            </x-context-widget>
        @endif

        @if ($dueFollowUps->isNotEmpty())
            <x-context-widget title="Seguimiento vencido" icon="bi-exclamation-circle" tone="warning">
                <dl class="md-context-list">
                    @foreach ($dueFollowUps as $due)
                        <div>
                            <dt>{{ $due->displayName() }}</dt>
                            <dd>{{ $due->daysSinceLastContact() }} d</dd>
                        </div>
                    @endforeach
                </dl>
            </x-context-widget>
        @endif

        <x-context-widget title="Organización" icon="bi-diagram-3">
            <div class="md-relationship-admin">
                @forelse ($circles as $circle)
                    <div class="md-relationship-admin__row">
                        <span>{{ $circle->name }}</span>
                        <span class="d-flex gap-1">
                            <button wire:click="openCircleForm('{{ $circle->id }}')" class="md-btn-icon" title="Editar círculo"><i class="bi bi-pencil"></i></button>
                            <button wire:click="deleteCircle('{{ $circle->id }}')" wire:confirm="Las relaciones de este círculo quedarán sin círculo. ¿Eliminar?"
                                    class="md-btn-icon" title="Eliminar círculo" style="color: var(--md-sys-color-error);"><i class="bi bi-trash"></i></button>
                        </span>
                    </div>
                @empty
                    <p class="md-body-small mb-2" style="color: var(--md-sys-color-on-surface-variant);">Sin círculos.</p>
                @endforelse

                <div class="md-relationship-admin__divider"></div>

                @forelse ($tags as $tag)
                    <div class="md-relationship-admin__row">
                        <span>{{ $tag->name }}</span>
                        <span class="d-flex gap-1">
                            <button wire:click="openTagForm('{{ $tag->id }}')" class="md-btn-icon" title="Editar etiqueta"><i class="bi bi-pencil"></i></button>
                            <button wire:click="deleteTag('{{ $tag->id }}')" wire:confirm="La etiqueta se quitará de todas las relaciones. ¿Eliminar?"
                                    class="md-btn-icon" title="Eliminar etiqueta" style="color: var(--md-sys-color-error);"><i class="bi bi-trash"></i></button>
                        </span>
                    </div>
                @empty
                    <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">Sin etiquetas.</p>
                @endforelse
            </div>
        </x-context-widget>
    </x-slot:rail>

    {{-- Circle dialog --}}
    <template x-if="showCircleDialog">
        <div>
            <div class="md-dialog-scrim" @click="showCircleDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">{{ $editingCircleId ? 'Editar' : 'Nuevo' }} círculo</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <div class="md-text-field">
                            <input type="text" wire:model="circleName" placeholder=" " id="circle-name">
                            <label for="circle-name">Nombre del círculo</label>
                        </div>
                        @error('circleName') <p class="md-body-small" style="color: var(--md-sys-color-error);">{{ $message }}</p> @enderror
                        <div class="md-text-field">
                            <input type="number" wire:model="circleFrequencyDays" placeholder=" " id="circle-freq" min="1">
                            <label for="circle-freq">Frecuencia de contacto (días)</label>
                        </div>
                        @error('circleFrequencyDays') <p class="md-body-small" style="color: var(--md-sys-color-error);">{{ $message }}</p> @enderror
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showCircleDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="saveCircle" class="md-btn-filled"><i class="bi bi-check-lg"></i> Guardar</button>
                </div>
            </div>
        </div>
    </template>

    {{-- Tag dialog --}}
    <template x-if="showTagDialog">
        <div>
            <div class="md-dialog-scrim" @click="showTagDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">{{ $editingTagId ? 'Editar' : 'Nueva' }} etiqueta</h2>
                <div class="md-dialog-content">
                    <div class="md-text-field">
                        <input type="text" wire:model="tagName" placeholder=" " id="tag-name">
                        <label for="tag-name">Nombre de la etiqueta</label>
                    </div>
                    @error('tagName') <p class="md-body-small" style="color: var(--md-sys-color-error);">{{ $message }}</p> @enderror
                </div>
                <div class="md-dialog-actions">
                    <button @click="showTagDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="saveTag" class="md-btn-filled"><i class="bi bi-check-lg"></i> Guardar</button>
                </div>
            </div>
        </div>
    </template>

    {{-- Person dialog --}}
    <template x-if="showPersonDialog">
        <div>
            <div class="md-dialog-scrim" @click="showPersonDialog = false"></div>
            <div class="md-dialog md-dialog--wide" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">{{ $editingId ? 'Editar' : 'Nueva' }} persona</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <div class="row g-3">
                            <div class="col-12 col-sm-7">
                                <div class="md-text-field">
                                    <input type="text" wire:model="fullName" placeholder=" " id="rel-name">
                                    <label for="rel-name">Nombre completo</label>
                                </div>
                                @error('fullName') <p class="md-body-small" style="color: var(--md-sys-color-error);">{{ $message }}</p> @enderror
                            </div>
                            <div class="col-12 col-sm-5">
                                <div class="md-text-field">
                                    <input type="text" wire:model="nickname" placeholder=" " id="rel-nick">
                                    <label for="rel-nick">Apodo</label>
                                </div>
                            </div>
                        </div>

                        <div class="row g-3">
                            <div class="col-12 col-sm-4">
                                <div class="md-text-field">
                                    <input type="text" wire:model="pronouns" placeholder=" " id="rel-pronouns">
                                    <label for="rel-pronouns">Pronombres</label>
                                </div>
                            </div>
                            <div class="col-12 col-sm-4">
                                <div class="md-text-field">
                                    <input type="text" wire:model="occupation" placeholder=" " id="rel-occupation">
                                    <label for="rel-occupation">Ocupación</label>
                                </div>
                            </div>
                            <div class="col-12 col-sm-4">
                                <div class="md-text-field">
                                    <input type="text" wire:model="organization" placeholder=" " id="rel-organization">
                                    <label for="rel-organization">Organización</label>
                                </div>
                            </div>
                        </div>

                        <div class="md-text-field">
                            <input type="text" wire:model="address" placeholder=" " id="rel-address">
                            <label for="rel-address">Dirección</label>
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
                                        @foreach ($categories as $key => $label)
                                            <option value="{{ $key }}">{{ $label }}</option>
                                        @endforeach
                                        @unless (array_key_exists($category, $categories))
                                            <option value="{{ $category }}">{{ ucfirst($category) }}</option>
                                        @endunless
                                    </select>
                                    <label for="rel-cat">Categoría</label>
                                </div>
                            </div>
                        </div>

                        <div class="row g-3">
                            <div class="col-4">
                                <div class="md-text-field">
                                    <select wire:model="birthdayMonth" id="rel-bm">
                                        <option value="">-</option>
                                        @foreach (['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'] as $index => $monthName)
                                            <option value="{{ $index + 1 }}">{{ ucfirst($monthName) }}</option>
                                        @endforeach
                                    </select>
                                    <label for="rel-bm">Mes de cumpleaños</label>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="md-text-field">
                                    <input type="number" wire:model="birthdayDay" placeholder=" " id="rel-bd" min="1" max="31">
                                    <label for="rel-bd">Día</label>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="md-text-field">
                                    <input type="number" wire:model="birthdayYear" placeholder=" " id="rel-by" min="1900" max="{{ now()->year }}">
                                    <label for="rel-by">Año (opcional)</label>
                                </div>
                            </div>
                        </div>
                        @error('birthdayDay') <p class="md-body-small" style="color: var(--md-sys-color-error);">{{ $message }}</p> @enderror
                        @error('birthdayMonth') <p class="md-body-small" style="color: var(--md-sys-color-error);">{{ $message }}</p> @enderror
                        @error('birthdayYear') <p class="md-body-small" style="color: var(--md-sys-color-error);">{{ $message }}</p> @enderror

                        <div class="md-text-field">
                            <input type="number" wire:model="contactFrequencyDays" placeholder=" " id="rel-freq" min="1">
                            <label for="rel-freq">Frecuencia de contacto propia (días)</label>
                        </div>

                        @if ($tags->isNotEmpty())
                            <fieldset class="md-relationship-tagset">
                                <legend class="md-label-medium">Etiquetas</legend>
                                <div class="d-flex flex-wrap gap-2">
                                    @foreach ($tags as $tag)
                                        <label class="md-chip md-chip-filter {{ in_array($tag->id, $selectedTags, true) ? 'selected' : '' }}">
                                            <input type="checkbox" class="md-visually-hidden" value="{{ $tag->id }}" wire:model.live="selectedTags">
                                            {{ $tag->name }}
                                        </label>
                                    @endforeach
                                </div>
                            </fieldset>
                        @endif

                        <fieldset class="md-relationship-contacts">
                            <legend class="md-label-medium">Medios de contacto</legend>
                            @foreach ($contactMethods as $index => $method)
                                <div class="md-relationship-contacts__row" wire:key="contact-{{ $index }}">
                                    <div class="md-text-field">
                                        <select wire:model="contactMethods.{{ $index }}.type" id="contact-type-{{ $index }}">
                                            @foreach (\App\Models\RelationshipContactMethod::TYPES as $key => $label)
                                                <option value="{{ $key }}">{{ $label }}</option>
                                            @endforeach
                                        </select>
                                        <label for="contact-type-{{ $index }}">Tipo</label>
                                    </div>
                                    <div class="md-text-field">
                                        <input type="text" wire:model="contactMethods.{{ $index }}.label" placeholder=" " id="contact-label-{{ $index }}">
                                        <label for="contact-label-{{ $index }}">Etiqueta</label>
                                    </div>
                                    <div class="md-text-field">
                                        <input type="text" wire:model="contactMethods.{{ $index }}.value" placeholder=" " id="contact-value-{{ $index }}">
                                        <label for="contact-value-{{ $index }}">Valor</label>
                                    </div>
                                    <label class="md-relationship-contacts__primary">
                                        <input type="checkbox" wire:model="contactMethods.{{ $index }}.is_primary">
                                        <span class="md-label-small">Principal</span>
                                    </label>
                                    <button type="button" wire:click="removeContactMethod({{ $index }})" class="md-btn-icon"
                                            title="Quitar medio" style="color: var(--md-sys-color-error);">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            @endforeach
                            <button type="button" wire:click="addContactMethod" class="md-btn-text mt-1">
                                <i class="bi bi-plus-lg"></i> Agregar medio de contacto
                            </button>
                        </fieldset>

                        <div class="md-text-field">
                            <textarea wire:model="generalNotes" placeholder=" " id="rel-notes" rows="3"></textarea>
                            <label for="rel-notes">Notas generales</label>
                        </div>
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button wire:click="closeForm" class="md-btn-text">Cancelar</button>
                    <button wire:click="save" class="md-btn-filled">
                        <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </div>
    </template>
</x-module-shell>
