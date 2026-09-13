<x-module-shell module="meals">
    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Crear receta', 'icon' => 'bi-book', 'action' => 'openForm']" />
    </x-slot:actions>

    {{-- Search + Filters --}}
    <x-ui.filter-bar search="search" placeholder="Buscar recetas..." label="Filtros de recetas">
        <x-slot:chips>

        
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
        </x-slot:chips>
    </x-ui.filter-bar>

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
    <x-ui.form-dialog :open="$showForm" close="closeForm" submit-action="save" id="recipe-dialog"
                      :title="$editingId ? 'Editar receta' : 'Crear receta'" icon="bi-book"
                      :submit="$editingId ? 'Actualizar' : 'Guardar'"
                      :sections="[
                          'basic' => ['label' => 'Información básica', 'icon' => 'bi-card-heading', 'error' => $errors->has('name')],
                          'ingredients' => ['label' => 'Ingredientes', 'icon' => 'bi-basket', 'error' => $errors->has('ingredients.*')],
                          'preparation' => ['label' => 'Preparación', 'icon' => 'bi-list-ol'],
                          'nutrition' => ['label' => 'Información nutricional', 'icon' => 'bi-fire'],
                      ]">
        <x-ui.form-dialog-section name="basic" title="Información básica">
            <div class="d-flex flex-column gap-3">
                <x-ui.field name="name" label="Nombre de la receta" :required="true" wire:model="name" />
                <div class="md-field-trio">
                    <x-ui.select name="mealType" label="Tipo de comida" :options="$this->mealTypes" :selected="$mealType" wire:model="mealType" />
                    <x-ui.select name="difficulty" label="Dificultad" :options="$this->difficulties" :selected="$difficulty" wire:model="difficulty" />
                    <x-ui.field name="prepTime" label="Tiempo (min)" type="number" min="1" wire:model="prepTime" />
                </div>
                <x-ui.textarea name="description" label="Descripción (opcional)" rows="2" wire:model="description" />
                <label class="d-flex align-items-center gap-2" style="cursor: pointer;">
                    <input type="checkbox" wire:model="favorite" class="md-checkbox">
                    <span class="md-body-medium">Marcar como favorita</span>
                </label>
            </div>
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="ingredients" title="Ingredientes">
            @foreach ($ingredients as $index => $ingredient)
                <div class="row g-2 mb-2 align-items-start" wire:key="ingredient-{{ $index }}">
                    <div class="col-12 col-md-5">
                        <x-ui.field name="ingredients.{{ $index }}.name" label="Ingrediente" :required="true" id="ing-name-{{ $index }}" list="shopping-items-list" wire:model="ingredients.{{ $index }}.name" />
                    </div>
                    <div class="col-6 col-md-3">
                        <x-ui.field name="ingredients.{{ $index }}.quantity" label="Cantidad" type="number" :required="true" id="ing-qty-{{ $index }}" min="0.01" max="999999.99" step="0.01" inputmode="decimal" wire:model="ingredients.{{ $index }}.quantity" />
                    </div>
                    <div class="col-5 col-md-3">
                        <x-ui.field name="ingredients.{{ $index }}.unit" label="Unidad" id="ing-unit-{{ $index }}" wire:model="ingredients.{{ $index }}.unit" />
                    </div>
                    <div class="col-1 text-end">
                        <button wire:click="removeIngredient({{ $index }})" type="button" class="md-btn-icon md-btn-icon--small" aria-label="Quitar ingrediente">
                            <i class="bi bi-x-lg" aria-hidden="true"></i>
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
                <div class="md-form-empty"><i class="bi bi-basket2" aria-hidden="true"></i><p>Agrega los ingredientes necesarios para preparar esta receta.</p></div>
            @endif
            <button wire:click="addIngredient" type="button" class="md-btn-text mt-2">
                <i class="bi bi-plus-lg" aria-hidden="true"></i> Agregar ingrediente
            </button>
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="preparation" title="Preparación">
            <x-ui.textarea name="instructions" label="Instrucciones (opcional)" rows="10" wire:model="instructions" />
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="nutrition" title="Información nutricional" description="Valores por porción, opcionales.">
            <div class="md-field-pair">
                <x-ui.field name="nutritionCalories" label="Calorías" type="number" wire:model="nutritionCalories" />
                <x-ui.field name="nutritionProtein" label="Proteína (g)" type="number" wire:model="nutritionProtein" />
                <x-ui.field name="nutritionCarbs" label="Carbos (g)" type="number" wire:model="nutritionCarbs" />
                <x-ui.field name="nutritionFat" label="Grasa (g)" type="number" wire:model="nutritionFat" />
            </div>
            @if ($editingId)
                <div class="mt-4">
                    <x-ui.destructive-action label="Eliminar receta" action="delete('{{ $editingId }}')"
                                             title="Eliminar receta" message="La receta y sus ingredientes se eliminan de forma permanente." />
                </div>
            @endif
        </x-ui.form-dialog-section>
    </x-ui.form-dialog>
</x-module-shell>
