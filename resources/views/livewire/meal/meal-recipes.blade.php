<x-module-shell module="meals" x-data="{ showDialog: $wire.entangle('showForm') }">
    <x-slot:actions>
        <button wire:click="openForm" class="md-btn-filled-tonal">
            <i class="bi bi-plus-lg"></i> Nueva receta
        </button>
    </x-slot:actions>

    {{-- Search + Filters --}}
    <div x-data="{ openMenu: null }" @click.outside="openMenu = null" class="mb-3">
        <div class="md-search-bar mb-2">
            <i class="bi bi-search md-search-bar__icon"></i>
            <input type="text" wire:model.live.debounce.300ms="search"
                   class="md-search-bar__input" placeholder="Buscar recetas...">
            @if($search)
                <button wire:click="$set('search', '')" class="md-search-bar__clear">
                    <i class="bi bi-x-lg"></i>
                </button>
            @endif
        </div>

        <div class="md-chip-rail">
            <button wire:click="$toggle('favoriteFilter')"
                    class="md-chip md-chip-filter {{ $favoriteFilter ? 'selected' : '' }}">
                <i class="bi bi-heart{{ $favoriteFilter ? '-fill' : '' }}"></i> Favoritos
            </button>

            <div class="md-chip-rail__divider"></div>

            {{-- Meal type chip-menu --}}
            <div class="md-chip-menu" :class="{ 'open': openMenu === 'mealType' }">
                <button @click="openMenu = openMenu === 'mealType' ? null : 'mealType'"
                        class="md-chip md-chip-filter {{ $mealTypeFilter ? 'selected' : '' }}">
                    {{ $mealTypeFilter ? $this->mealTypes[$mealTypeFilter] : 'Tipo de comida' }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'mealType'" x-transition x-cloak class="md-chip-menu__dropdown">
                    <button wire:click="$set('mealTypeFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $mealTypeFilter === '' ? 'active' : '' }}">Todos</button>
                    @foreach ($this->mealTypes as $key => $label)
                        <button wire:click="$set('mealTypeFilter', '{{ $key }}')" @click="openMenu = null"
                                class="md-chip-menu__item {{ $mealTypeFilter === $key ? 'active' : '' }}">{{ $label }}</button>
                    @endforeach
                </div>
            </div>

            {{-- Difficulty chip-menu --}}
            <div class="md-chip-menu" :class="{ 'open': openMenu === 'difficulty' }">
                <button @click="openMenu = openMenu === 'difficulty' ? null : 'difficulty'"
                        class="md-chip md-chip-filter {{ $difficultyFilter ? 'selected' : '' }}">
                    {{ $difficultyFilter ? $this->difficulties[$difficultyFilter] : 'Dificultad' }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'difficulty'" x-transition x-cloak class="md-chip-menu__dropdown">
                    <button wire:click="$set('difficultyFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $difficultyFilter === '' ? 'active' : '' }}">Todas</button>
                    @foreach ($this->difficulties as $key => $label)
                        <button wire:click="$set('difficultyFilter', '{{ $key }}')" @click="openMenu = null"
                                class="md-chip-menu__item {{ $difficultyFilter === $key ? 'active' : '' }}">{{ $label }}</button>
                    @endforeach
                </div>
            </div>
        </div>
    </div>

    {{-- Recipe Grid --}}
    @if ($recipes->isEmpty())
        <div class="md-card-elevated p-4 text-center">
            <i class="bi bi-book" style="font-size: 2rem; color: var(--md-sys-color-outline);"></i>
            <p class="md-body-large mt-2" style="color: var(--md-sys-color-on-surface-variant);">
                {{ $search || $mealTypeFilter || $difficultyFilter || $favoriteFilter ? 'No se encontraron recetas con esos filtros.' : 'Aún no tienes recetas. ¡Agrega la primera!' }}
            </p>
        </div>
    @else
        <div class="row g-3">
            @foreach ($recipes as $recipe)
                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="md-card-elevated p-3 h-100" style="cursor: pointer;" wire:click="openForm('{{ $recipe->id }}')">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h3 class="md-title-medium mb-0" style="color: var(--md-sys-color-on-surface);">{{ $recipe->name }}</h3>
                            <button wire:click.stop="toggleFavorite('{{ $recipe->id }}')" class="md-btn-icon md-btn-icon--small">
                                <i class="bi bi-heart{{ $recipe->favorite ? '-fill' : '' }}" style="{{ $recipe->favorite ? 'color: var(--md-sys-color-error);' : '' }}"></i>
                            </button>
                        </div>

                        <div class="d-flex flex-wrap gap-1 mb-2">
                            <span class="md-chip md-chip--small">{{ $this->mealTypes[$recipe->meal_type] ?? $recipe->meal_type }}</span>
                            <span class="md-chip md-chip--small">{{ $this->difficulties[$recipe->difficulty] ?? $recipe->difficulty }}</span>
                            @if ($recipe->prep_time)
                                <span class="md-chip md-chip--small"><i class="bi bi-clock"></i> {{ $recipe->prep_time }} min</span>
                            @endif
                        </div>

                        @if ($recipe->description)
                            <p class="md-body-small mb-2" style="color: var(--md-sys-color-on-surface-variant); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                {{ $recipe->description }}
                            </p>
                        @endif

                        <div class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">
                            <i class="bi bi-basket"></i> {{ $recipe->recipe_ingredients_count }} ingredientes
                            @if ($recipe->nutrition && isset($recipe->nutrition['calories']))
                                &middot; {{ $recipe->nutrition['calories'] }} kcal
                            @endif
                        </div>
                    </div>
                </div>
            @endforeach
        </div>

        <div class="mt-3">
            {{ $recipes->links() }}
        </div>
    @endif

    {{-- Dialog --}}
    <template x-if="showDialog">
        <div>
            <div class="md-dialog-scrim" @click="$wire.closeForm()"></div>
            <section class="md-dialog md-dialog--large" role="dialog" aria-modal="true" aria-labelledby="recipe-dialog-title" @click.stop>
                <header class="md-dialog-header">
                    <div>
                        <h2 id="recipe-dialog-title" class="md-headline-small mb-1">{{ $editingId ? 'Editar receta' : 'Nueva receta' }}</h2>
                        <p class="md-body-medium mb-0">Organiza la preparación, sus ingredientes y la información nutricional</p>
                    </div>
                    <button type="button" wire:click="closeForm" class="md-btn-icon" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
                </header>
                <div class="md-dialog-content md-dialog-layout md-dialog-layout--equal">
                    <div class="d-flex flex-column gap-3">
                    <section class="md-form-section">
                        <div class="md-form-section__header"><div><i class="bi bi-card-heading"></i><span>Información general</span></div></div>
                        <div class="d-flex flex-column gap-3">
                        {{-- Basic info --}}
                        <div class="md-text-field">
                            <input type="text" wire:model="name" placeholder=" " id="recipe-name">
                            <label for="recipe-name">Nombre de la receta *</label>
                        </div>

                        <div class="row g-3">
                            <div class="col-6 col-md-4">
                                <div class="md-text-field">
                                    <select wire:model="mealType" id="recipe-meal-type">
                                        @foreach ($this->mealTypes as $key => $label)
                                            <option value="{{ $key }}">{{ $label }}</option>
                                        @endforeach
                                    </select>
                                    <label for="recipe-meal-type">Tipo de comida</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="md-text-field">
                                    <select wire:model="difficulty" id="recipe-difficulty">
                                        @foreach ($this->difficulties as $key => $label)
                                            <option value="{{ $key }}">{{ $label }}</option>
                                        @endforeach
                                    </select>
                                    <label for="recipe-difficulty">Dificultad</label>
                                </div>
                            </div>
                            <div class="col-12 col-md-4">
                                <div class="md-text-field">
                                    <input type="number" wire:model="prepTime" placeholder=" " id="recipe-prep-time" min="1">
                                    <label for="recipe-prep-time">Tiempo (min)</label>
                                </div>
                            </div>
                        </div>

                        <div class="md-text-field">
                            <textarea wire:model="description" placeholder=" " id="recipe-description" rows="2"></textarea>
                            <label for="recipe-description">Descripción (opcional)</label>
                        </div>

                        <label class="d-flex align-items-center gap-2" style="cursor: pointer;">
                            <input type="checkbox" wire:model="favorite" class="md-checkbox">
                            <span class="md-body-medium">Marcar como favorita</span>
                        </label>
                        </div>
                    </section>

                    <section class="md-form-section">
                        <div class="md-form-section__header"><div><i class="bi bi-list-ol"></i><span>Preparación</span></div></div>
                        <div class="md-text-field">
                            <textarea wire:model="instructions" placeholder=" " id="recipe-instructions" rows="10"></textarea>
                            <label for="recipe-instructions">Instrucciones (opcional)</label>
                        </div>
                    </section>
                    </div>

                    <div class="d-flex flex-column gap-3">

                        {{-- Nutrition --}}
                        <section class="md-form-section">
                            <div class="md-form-section__header"><div><i class="bi bi-fire"></i><span>Información nutricional</span></div></div>
                            <div class="row g-2 mt-2">
                                <div class="col-6 col-md-3">
                                    <div class="md-text-field">
                                        <input type="number" wire:model="nutritionCalories" placeholder=" " id="recipe-cal">
                                        <label for="recipe-cal">Calorías</label>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="md-text-field">
                                        <input type="number" wire:model="nutritionProtein" placeholder=" " id="recipe-prot">
                                        <label for="recipe-prot">Proteína (g)</label>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="md-text-field">
                                        <input type="number" wire:model="nutritionCarbs" placeholder=" " id="recipe-carbs">
                                        <label for="recipe-carbs">Carbos (g)</label>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="md-text-field">
                                        <input type="number" wire:model="nutritionFat" placeholder=" " id="recipe-fat">
                                        <label for="recipe-fat">Grasa (g)</label>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {{-- Ingredients --}}
                        <section class="md-form-section">
                            <div class="md-form-section__header">
                                <div><i class="bi bi-basket"></i><span>Ingredientes</span><span class="md-chip md-chip--small">{{ count($ingredients) }}</span></div>
                                <button wire:click="addIngredient" type="button" class="md-btn-text md-btn-text--small">
                                    <i class="bi bi-plus"></i> Agregar
                                </button>
                            </div>

                            @foreach ($ingredients as $index => $ingredient)
                                <div class="row g-2 mb-2 align-items-start" wire:key="ingredient-{{ $index }}">
                                    <div class="col-12 col-md-5">
                                        <div @class(['md-text-field', 'md-error' => $errors->has("ingredients.$index.name")])>
                                            <input type="text" wire:model="ingredients.{{ $index }}.name" placeholder=" " id="ing-name-{{ $index }}" list="shopping-items-list" required aria-invalid="{{ $errors->has("ingredients.$index.name") ? 'true' : 'false' }}">
                                            <label for="ing-name-{{ $index }}">Ingrediente *</label>
                                            @error("ingredients.$index.name")<div class="md-supporting-text">{{ $message }}</div>@enderror
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-2">
                                        <div @class(['md-text-field', 'md-error' => $errors->has("ingredients.$index.quantity")])>
                                            <input type="number" wire:model="ingredients.{{ $index }}.quantity" placeholder=" " id="ing-qty-{{ $index }}" min="0.01" max="999999.99" step="0.01" required inputmode="decimal" aria-invalid="{{ $errors->has("ingredients.$index.quantity") ? 'true' : 'false' }}">
                                            <label for="ing-qty-{{ $index }}">Cantidad *</label>
                                            @error("ingredients.$index.quantity")<div class="md-supporting-text">{{ $message }}</div>@enderror
                                        </div>
                                    </div>
                                    <div class="col-5 col-md-3">
                                        <div class="md-text-field">
                                            <input type="text" wire:model="ingredients.{{ $index }}.unit" placeholder=" " id="ing-unit-{{ $index }}">
                                            <label for="ing-unit-{{ $index }}">Unidad</label>
                                        </div>
                                    </div>
                                    <div class="col-1 col-md-2 text-end">
                                        <button wire:click="removeIngredient({{ $index }})" type="button" class="md-btn-icon md-btn-icon--small">
                                            <i class="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                </div>
                            @endforeach

                            <datalist id="shopping-items-list">
                                @foreach ($shoppingItems as $item)
                                    <option value="{{ $item->name }}">
                                @endforeach
                            </datalist>
                            @if (empty($ingredients))
                                <div class="md-form-empty"><i class="bi bi-basket2"></i><p>Agrega los ingredientes necesarios para preparar esta receta.</p></div>
                            @endif
                        </section>
                    </div>
                </div>
                <footer class="md-dialog-actions">
                    @if ($editingId)
                        <button type="button" wire:click="delete('{{ $editingId }}')" wire:confirm="¿Eliminar esta receta?" class="md-btn-text md-btn-danger">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    @endif
                    <span class="md-dialog-actions__spacer"></span>
                    <button type="button" wire:click="closeForm" class="md-btn-text">Cancelar</button>
                    <button type="button" wire:click="save" class="md-btn-filled">
                        <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}
                    </button>
                </footer>
            </section>
        </div>
    </template>
</x-module-shell>
