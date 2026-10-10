<x-module-shell module="meals">
    <x-slot:controls>
        <div class="md-date-navigator">
            <button wire:click="previousWeek" class="md-btn-icon" aria-label="Semana anterior"><i class="bi bi-chevron-left"></i></button>
            <button wire:click="thisWeek" class="md-date-navigator__today">Esta semana</button>
            <span class="md-date-navigator__label">{{ $weekStart->format('d M') }} – {{ $weekStart->copy()->endOfWeek()->format('d M') }}</span>
            <button wire:click="nextWeek" class="md-btn-icon" aria-label="Semana siguiente"><i class="bi bi-chevron-right"></i></button>
        </div>
    </x-slot:controls>

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
                                role="button" tabindex="0" aria-label="{{ $typeLabel }} del {{ $date->format('d/m/Y') }}"
                                wire:keydown.enter="openForm('{{ $date->format('Y-m-d') }}', '{{ $typeKey }}')"
                                wire:keydown.space.prevent="openForm('{{ $date->format('Y-m-d') }}', '{{ $typeKey }}')"
                                wire:click="openForm('{{ $date->format('Y-m-d') }}', '{{ $typeKey }}')">
                                @if ($entry)
                                    <span class="md-label-small">{{ $entry->status === 'consumed' ? ($entry->consumption_mode === 'outside' ? 'Comida por fuera' : 'Consumida') : 'Planeada' }}</span>
                                    <div class="meal-slot__items" title="{{ $entry->items->map(fn ($item) => $item->recipe?->name ?? $item->name)->implode(' + ') }}">
                                        @foreach ($entry->items->take(2) as $item)
                                            <span>{{ $item->recipe?->name ?? $item->name }}</span>
                                        @endforeach
                                        @if ($entry->items->count() > 2)
                                            <strong>+{{ $entry->items->count() - 2 }}</strong>
                                        @endif
                                    </div>
                                    @php $slotCalories = $entry->status === 'consumed' ? ($entry->consumption['calories'] ?? null) : $entry->effective_calories; @endphp
                                    @if ($slotCalories > 0)
                                        <span class="md-label-small meal-slot__calories">{{ $slotCalories }} kcal</span>
                                    @endif
                                @else
                                    <span class="meal-slot__empty"><i class="bi bi-plus-lg"></i></span>
                                @endif
                            </td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="meal-week-grid__totals">
                    <th scope="row" class="md-label-large meal-week-grid__type">Planeado / consumido</th>
                    @foreach ($weekDates as $date)
                        @php $dayCalories = $dailyCalories->get($date->format('Y-m-d'), 0); @endphp
                        <td class="text-center {{ $date->isToday() ? 'is-today' : '' }}">
                            @if ($dayCalories > 0)
                                <strong>{{ number_format($dayCalories, 0, ',', '.') }}</strong> <small>kcal</small>
                            @else
                                <span class="meal-slot__empty">—</span>
                            @endif
                            <div class="md-label-small">{{ $consumedCalories->get($date->format('Y-m-d'), 0) }} kcal consumidas</div>
                        </td>
                    @endforeach
                </tr>
            </tfoot>
        </table>
        @if ($plannedDays > 0)
            <p class="md-body-small meal-week-grid__summary mb-0">
                Pendiente de la semana: <strong>{{ number_format($weekCalories, 0, ',', '.') }} kcal</strong>
                · promedio <strong>{{ number_format($weekCalories / $plannedDays, 0, ',', '.') }} kcal/día</strong>
                en {{ $plannedDays }} {{ $plannedDays === 1 ? 'día planificado' : 'días planificados' }}
            </p>
        @endif
    </div>

    <x-ui.form-dialog :open="$showForm" close="closeForm" id="meal-plan-editor" module="meals"
                      :title="($editingId ? 'Editar' : 'Planear').' '.mb_strtolower($mealTypes[$formMealType] ?? $formMealType)"
                      icon="bi-egg-fried" submit-action="save" :submit="$editingId ? 'Actualizar' : 'Guardar'">
                <p class="md-body-medium">{{ $formDate ? \Carbon\Carbon::parse($formDate)->translatedFormat('l d \d\e F') : '' }}</p>
                @if ($errors->any())
                    <div role="alert" class="md-form-notice">@foreach ($errors->all() as $message)<p>{{ $message }}</p>@endforeach</div>
                @endif
                @if ($formStatus === 'consumed')
                    <section class="md-form-section mb-3">
                        <h3 class="md-title-small">{{ $consumptionMode === 'outside' ? 'Comida por fuera' : 'Comida consumida' }}</h3>
                        <p>{{ $consumption['calories'] ?? 'Sin registrar' }} kcal · {{ $consumption['notes'] ?? '' }}</p>
                        @foreach ($consumption['warnings'] ?? [] as $warning)<p role="status">{{ $warning }}</p>@endforeach
                        <p>El plan original se conserva. Revierte el consumo para editarlo.</p>
                        <button type="button" wire:click="revertConsumption" wire:loading.attr="disabled" class="md-btn-text">Revertir consumo</button>
                    </section>
                @endif
                <fieldset class="border-0 p-0 m-0" @disabled($formStatus === 'consumed')>
                <div class="md-dialog-layout">
                    <section class="md-form-section">
                        <div class="md-form-section__header">
                            <div><i class="bi bi-egg-fried"></i><span>Composición</span></div>
                            <button type="button" wire:click="addCustomItem" class="md-btn-text md-btn-text--small"><i class="bi bi-plus-lg" aria-hidden="true"></i> Elemento libre</button>
                        </div>

                        <div class="d-flex flex-wrap gap-2 align-items-end mb-3">
                            <div class="flex-grow-1">
                                <x-ui.select id="meal-preparation" label="Agregar preparación cocinada" wire:model="selectedPreparation" placeholder="Elegir preparación">
                                    @foreach ($preparations as $prep)<option value="{{ $prep->id }}">{{ $prep->name }} · {{ $prep->remaining() - $prep->reserved() }} porciones sin reservar</option>@endforeach
                                </x-ui.select>
                            </div>
                            <button type="button" wire:click="addPreparation" class="md-btn-text">Añadir preparación</button>
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
                                <article class="meal-composition-item {{ empty($item['recipe_id']) && empty($item['preparation_id']) ? 'meal-composition-item--free' : '' }}" wire:key="{{ $item['key'] }}">
                                    <div class="meal-composition-item__order">
                                        <button type="button" wire:click="moveItem({{ $index }}, -1)" class="md-btn-icon md-btn-icon--small" aria-label="Subir" @disabled($loop->first)><i class="bi bi-chevron-up"></i></button>
                                        <button type="button" wire:click="moveItem({{ $index }}, 1)" class="md-btn-icon md-btn-icon--small" aria-label="Bajar" @disabled($loop->last)><i class="bi bi-chevron-down"></i></button>
                                    </div>
                                    <div class="meal-composition-item__body">
                                        @if ($item['recipe_id'] || !empty($item['preparation_id']))
                                            <div class="meal-composition-item__title"><i class="bi bi-book"></i><span>{{ $item['name'] }}</span></div>
                                            @if (!empty($item['preparation_id']))<span class="md-label-small">Preparación · ingredientes ya descontados</span>@endif
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
                                            <div class="mt-2">
                                                @foreach ($item['ingredients'] ?? [] as $ingredientIndex => $ingredient)
                                                    <fieldset class="border rounded p-2 mb-2" wire:key="meal-ingredient-{{ $item['key'] }}-{{ $ingredientIndex }}">
                                                        <legend class="md-label-medium">Ingrediente {{ $ingredientIndex + 1 }}</legend>
                                                        <x-ui.select id="meal-product-{{ $index }}-{{ $ingredientIndex }}" label="Producto" wire:model="formItems.{{ $index }}.ingredients.{{ $ingredientIndex }}.shopping_item_id" placeholder="Elegir producto">
                                                            @foreach ($products as $product)<option value="{{ $product->id }}">{{ $product->name }} ({{ $product->base_unit }})</option>@endforeach
                                                        </x-ui.select>
                                                        <x-ui.field id="meal-quantity-{{ $index }}-{{ $ingredientIndex }}" label="Cantidad" type="number" min="0.001" step="0.001" wire:model="formItems.{{ $index }}.ingredients.{{ $ingredientIndex }}.quantity" />
                                                        <x-ui.field id="meal-unit-{{ $index }}-{{ $ingredientIndex }}" label="Unidad (vacía = unidad base)" wire:model="formItems.{{ $index }}.ingredients.{{ $ingredientIndex }}.unit" help="g, kg, ml, L, unit" />
                                                        <button type="button" wire:click="removeIngredient({{ $index }}, {{ $ingredientIndex }})" class="md-btn-text">Quitar ingrediente</button>
                                                    </fieldset>
                                                @endforeach
                                                <button type="button" wire:click="addIngredient({{ $index }})" class="md-btn-text">Enlazar ingrediente</button>
                                                @if (empty($item['ingredients']))<p class="md-label-small">Sin ingredientes enlazados: al consumir no se descontará inventario.</p>@endif
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
                </fieldset>

                @if ($formStatus === 'planned')
                    <section class="md-form-section mt-3">
                        <h3 class="md-title-small">Registrar consumo</h3>
                        <button type="button" wire:click="consume('home')" wire:loading.attr="disabled" class="md-btn-tonal">Marcar consumida</button>
                        <x-ui.field id="outside-notes" label="Notas de comida por fuera" wire:model="outsideNotes" />
                        <x-ui.field id="outside-calories" label="Calorías consumidas por fuera (opcional)" type="number" min="0" wire:model="outsideCalories" />
                        <button type="button" wire:click="consume('outside')" wire:loading.attr="disabled" class="md-btn-text">Comí por fuera</button>
                    </section>
                @endif
                @if ($editingId && $formStatus === 'planned')
                    <section class="md-form-section mt-3">
                        <h3 class="md-title-small">Mover, copiar o intercambiar la comida guardada</h3>
                        <x-ui.field id="meal-target-date" label="Fecha destino" type="date" wire:model="targetDate" />
                        <x-ui.select id="meal-target-type" label="Comida destino" wire:model="targetMealType" :options="$mealTypes" />
                        @foreach (['move' => 'Mover', 'copy' => 'Copiar', 'swap' => 'Intercambiar'] as $action => $label)<button type="button" wire:click="rearrange('{{ $action }}')" wire:loading.attr="disabled" class="md-btn-text">{{ $label }}</button>@endforeach
                    </section>
                    <button type="button" wire:click="delete({{ $editingId }})" wire:confirm="¿Eliminar esta comida planificada?" class="md-btn-text md-btn-danger mt-3"><i class="bi bi-trash" aria-hidden="true"></i> Eliminar</button>
                @endif
    </x-ui.form-dialog>
</x-module-shell>
