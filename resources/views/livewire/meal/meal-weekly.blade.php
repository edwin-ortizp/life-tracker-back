<x-module-shell module="meals" x-data="{ showDialog: $wire.entangle('showForm') }">
    <x-slot:actions>
        <div class="md-date-navigator">
            <button wire:click="previousWeek" class="md-btn-icon" aria-label="Semana anterior"><i class="bi bi-chevron-left"></i></button>
            <button wire:click="thisWeek" class="md-date-navigator__today">Esta semana</button>
            <span class="md-date-navigator__label">{{ $weekStart->format('d M') }} – {{ $weekStart->copy()->endOfWeek()->format('d M') }}</span>
            <button wire:click="nextWeek" class="md-btn-icon" aria-label="Semana siguiente"><i class="bi bi-chevron-right"></i></button>
        </div>
    </x-slot:actions>

    <div class="md-card-elevated meal-week-grid">
        <table class="table table-bordered align-middle mb-0">
            <thead>
                <tr>
                    <th class="meal-week-grid__type"></th>
                    @foreach ($weekDates as $date)
                        <th class="text-center {{ $date->isToday() ? 'is-today' : '' }}">
                            <div class="md-label-small">{{ $date->translatedFormat('D') }}</div>
                            <div class="md-title-medium">{{ $date->format('d') }}</div>
                        </th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach ($mealTypes as $typeKey => $typeLabel)
                    <tr>
                        <td class="md-label-large meal-week-grid__type">{{ $typeLabel }}</td>
                        @foreach ($weekDates as $date)
                            @php
                                $key = $date->format('Y-m-d').'|'.$typeKey;
                                $entry = $entries->get($key)?->first();
                            @endphp
                            <td class="meal-slot {{ $date->isToday() ? 'is-today' : '' }}"
                                wire:click="openForm('{{ $date->format('Y-m-d') }}', '{{ $typeKey }}')">
                                @if ($entry)
                                    <div class="meal-slot__items" title="{{ $entry->items->map(fn ($item) => $item->recipe?->name ?? $item->name)->implode(' + ') }}">
                                        @foreach ($entry->items->take(2) as $item)
                                            <span>{{ $item->recipe?->name ?? $item->name }}</span>
                                        @endforeach
                                        @if ($entry->items->count() > 2)
                                            <strong>+{{ $entry->items->count() - 2 }}</strong>
                                        @endif
                                    </div>
                                    @if ($entry->effective_calories > 0)
                                        <span class="md-label-small meal-slot__calories">{{ $entry->effective_calories }} kcal</span>
                                    @endif
                                @else
                                    <span class="meal-slot__empty"><i class="bi bi-plus-lg"></i></span>
                                @endif
                            </td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <template x-if="showDialog">
        <div>
            <div class="md-dialog-scrim" @click="$wire.closeForm()"></div>
            <section class="md-dialog md-dialog--large meal-dialog" role="dialog" aria-modal="true" aria-labelledby="meal-dialog-title" @click.stop>
                <header class="md-dialog-header">
                    <div>
                        <h2 id="meal-dialog-title" class="md-headline-small mb-1">{{ $editingId ? 'Editar' : 'Planear' }} {{ mb_strtolower($mealTypes[$formMealType] ?? $formMealType) }}</h2>
                        <p class="md-body-medium mb-0">{{ \Carbon\Carbon::parse($formDate)->translatedFormat('l d \d\e F') }}</p>
                    </div>
                    <button type="button" wire:click="closeForm" class="md-btn-icon" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
                </header>

                <div class="md-dialog-content md-dialog-layout md-dialog-layout--main-aside">
                    <section class="md-form-section">
                        <div class="md-form-section__header">
                            <div><i class="bi bi-egg-fried"></i><span>Composición</span></div>
                            <button type="button" wire:click="addCustomItem" class="md-btn-text md-btn-text--small"><i class="bi bi-plus-lg"></i> Elemento libre</button>
                        </div>

                        <div class="meal-recipe-combobox" x-data="{ open: false, active: 0 }" @click.outside="open = false">
                            <label for="meal-recipe-search" class="md-label-medium">Agregar una receta</label>
                            <div class="md-search-bar">
                                <i class="bi bi-search md-search-bar__icon"></i>
                                <input id="meal-recipe-search" type="text" class="md-search-bar__input"
                                       placeholder="Escribe para buscar entre tus recetas..."
                                       wire:model.live.debounce.250ms="recipeSearch"
                                       role="combobox" aria-autocomplete="list" aria-controls="meal-recipe-results"
                                       :aria-expanded="open"
                                       @focus="open = true"
                                       @keydown.escape="open = false"
                                       @keydown.arrow-down.prevent="active = Math.min(active + 1, {{ max($recipeResults->count() - 1, 0) }})"
                                       @keydown.arrow-up.prevent="active = Math.max(active - 1, 0)"
                                       @keydown.enter.prevent="if (open && $refs['result' + active]) $refs['result' + active].click()">
                                @if ($recipeSearch)
                                    <button type="button" wire:click="$set('recipeSearch', '')" class="md-search-bar__clear" aria-label="Limpiar búsqueda"><i class="bi bi-x-lg"></i></button>
                                @endif
                            </div>
                            <div id="meal-recipe-results" class="meal-recipe-results" role="listbox" x-show="open" x-cloak>
                                @forelse ($recipeResults as $resultIndex => $recipe)
                                    <button type="button" role="option" class="meal-recipe-result"
                                            :class="{ 'is-active': active === {{ $resultIndex }} }"
                                            x-ref="result{{ $resultIndex }}"
                                            wire:key="recipe-result-{{ $recipe->id }}"
                                            wire:click="addRecipe('{{ $recipe->id }}')" @click="open = false; active = 0">
                                        <span><strong>{{ $recipe->name }}</strong><small>{{ $mealTypes[$recipe->meal_type] ?? $recipe->meal_type }}</small></span>
                                        <span class="md-label-small">@if($recipe->favorite)<i class="bi bi-heart-fill"></i>@endif {{ isset($recipe->nutrition['calories']) ? $recipe->nutrition['calories'].' kcal' : 'Sin calorías' }}</span>
                                    </button>
                                @empty
                                    <p class="meal-recipe-results__empty">No hay recetas disponibles con esa búsqueda.</p>
                                @endforelse
                            </div>
                        </div>

                        <div class="meal-composition-list">
                            @forelse ($formItems as $index => $item)
                                <article class="meal-composition-item" wire:key="{{ $item['key'] }}">
                                    <div class="meal-composition-item__order">
                                        <button type="button" wire:click="moveItem({{ $index }}, -1)" class="md-btn-icon md-btn-icon--small" aria-label="Subir" @disabled($loop->first)><i class="bi bi-chevron-up"></i></button>
                                        <button type="button" wire:click="moveItem({{ $index }}, 1)" class="md-btn-icon md-btn-icon--small" aria-label="Bajar" @disabled($loop->last)><i class="bi bi-chevron-down"></i></button>
                                    </div>
                                    <div class="meal-composition-item__body">
                                        @if ($item['recipe_id'])
                                            <div class="meal-composition-item__title"><i class="bi bi-book"></i><span>{{ $item['name'] }}</span></div>
                                            <div class="md-text-field meal-composition-item__portion">
                                                <input type="number" min="0.01" step="0.25" wire:model.live.debounce.250ms="formItems.{{ $index }}.portions" id="meal-portions-{{ $index }}" placeholder=" ">
                                                <label for="meal-portions-{{ $index }}">Porciones</label>
                                            </div>
                                            <span class="md-label-small meal-composition-item__energy">{{ $item['recipe_calories'] !== null ? round($item['recipe_calories'] * ($item['portions'] ?: 0)).' kcal' : 'Calorías sin registrar' }}</span>
                                        @else
                                            <div class="md-text-field">
                                                <input type="text" wire:model="formItems.{{ $index }}.name" id="meal-custom-name-{{ $index }}" placeholder=" ">
                                                <label for="meal-custom-name-{{ $index }}">Elemento libre</label>
                                                @error("formItems.$index.name")<small class="text-danger">{{ $message }}</small>@enderror
                                            </div>
                                            <div class="md-text-field meal-composition-item__portion">
                                                <input type="number" min="0" wire:model.live.debounce.250ms="formItems.{{ $index }}.calories" id="meal-custom-calories-{{ $index }}" placeholder=" ">
                                                <label for="meal-custom-calories-{{ $index }}">Calorías</label>
                                            </div>
                                        @endif
                                    </div>
                                    <button type="button" wire:click="removeItem({{ $index }})" class="md-btn-icon md-btn-icon--small meal-composition-item__remove" aria-label="Quitar"><i class="bi bi-trash"></i></button>
                                </article>
                            @empty
                                <div class="md-form-empty"><i class="bi bi-basket2"></i><p>Busca una receta o agrega un elemento libre para armar esta comida.</p></div>
                            @endforelse
                            @error('formItems')<small class="text-danger">{{ $message }}</small>@enderror
                        </div>
                    </section>

                    <aside class="d-flex flex-column gap-3">
                        <section class="md-form-section">
                            <div class="md-form-section__header"><div><i class="bi bi-fire"></i><span>Resumen nutricional</span></div></div>
                            <div class="meal-calorie-summary">
                                <div><span>Total efectivo</span><strong>{{ $formCalories ?? $this->calculatedFormCalories() }} kcal</strong></div>
                                <div><span>Cálculo por componentes</span><strong>{{ $this->calculatedFormCalories() }} kcal</strong></div>
                            </div>
                            @if ($this->formHasIncompleteCalories())
                                <p class="md-form-notice"><i class="bi bi-exclamation-circle"></i> El cálculo es parcial: alguna receta no tiene calorías registradas.</p>
                            @endif
                            <div class="md-text-field mt-3">
                                <input type="number" min="0" wire:model="formCalories" id="meal-calories" placeholder=" ">
                                <label for="meal-calories">Ajuste manual del total</label>
                            </div>
                            @if ($formCalories !== null)
                                <button type="button" wire:click="useCalculatedCalories" class="md-btn-text md-btn-text--small mt-2"><i class="bi bi-arrow-counterclockwise"></i> Usar cálculo</button>
                            @endif
                        </section>
                        <section class="md-form-section">
                            <div class="md-form-section__header"><div><i class="bi bi-card-text"></i><span>Notas</span></div></div>
                            <div class="md-text-field">
                                <textarea wire:model="formNotes" id="meal-notes" rows="6" placeholder=" "></textarea>
                                <label for="meal-notes">Preparación, acompañamientos o recordatorios</label>
                            </div>
                        </section>
                    </aside>
                </div>

                <footer class="md-dialog-actions">
                    @if ($editingId)
                        <button type="button" wire:click="delete({{ $editingId }})" wire:confirm="¿Eliminar esta comida planificada?" class="md-btn-text md-btn-danger"><i class="bi bi-trash"></i> Eliminar</button>
                    @endif
                    <span class="md-dialog-actions__spacer"></span>
                    <button type="button" wire:click="closeForm" class="md-btn-text">Cancelar</button>
                    <button type="button" wire:click="save" class="md-btn-filled"><i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}</button>
                </footer>
            </section>
        </div>
    </template>
</x-module-shell>
