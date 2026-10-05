<x-module-shell module="meals">
    <x-slot:actions>
        <livewire:meal.bulk-ingredient-assistant context="ingredients" />
        <x-module-actions :primary="['label' => 'Agregar ingrediente', 'icon' => 'bi-basket', 'action' => 'openForm']"
                          :secondary="[['label' => 'Tiendas', 'icon' => 'bi-shop', 'event' => 'open-store-catalog']]" />
        <livewire:meal.store-catalog />
    </x-slot:actions>

    <x-ui.management-card id="meal-ingredients" title="Catálogo de ingredientes" icon="bi-basket" :count="'('.$ingredients->total().' / '.$catalogTotal.')'"
                          search="search" search-placeholder="Buscar ingredientes" :active-filters="$activeFilters"
                          :paginator="$ingredients" noun="ingredientes" alpine="openMenu: null">
        <x-slot:filters>
            <div class="md-chip-rail md-mcard__filter-chips" role="group" aria-label="Filtros de ingredientes" @click.outside="openMenu = null">
        
            {{-- Category chip-menu --}}
            <div class="md-chip-menu" :class="{ 'open': openMenu === 'category' }">
                <button @click="openMenu = openMenu === 'category' ? null : 'category'"
                        class="md-chip md-chip-filter {{ $categoryFilter ? 'selected' : '' }}">
                    {{ $categoryFilter ? $this->categoryOptions[$categoryFilter] : 'Categoría' }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'category'" x-transition x-cloak class="md-chip-menu__dropdown">
                    <button wire:click="$set('categoryFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $categoryFilter === '' ? 'active' : '' }}">Todas</button>
                    @foreach ($this->categoryOptions as $key => $label)
                        <button wire:click="$set('categoryFilter', '{{ $key }}')" @click="openMenu = null"
                                class="md-chip-menu__item {{ $categoryFilter === $key ? 'active' : '' }}">{{ $label }}</button>
                    @endforeach
                </div>
            </div>

            <div class="md-chip-menu" :class="{ 'open': openMenu === 'store' }">
                <button @click="openMenu = openMenu === 'store' ? null : 'store'"
                        class="md-chip md-chip-filter {{ $storeFilter ? 'selected' : '' }}">
                    <i class="bi bi-shop"></i> {{ $storeFilter === '__none' ? 'Sin tienda' : ($stores[$storeFilter] ?? 'Tienda') }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'store'" x-transition x-cloak class="md-chip-menu__dropdown">
                    <button wire:click="$set('storeFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $storeFilter === '' ? 'active' : '' }}">Todas</button>
                    <button wire:click="$set('storeFilter', '__none')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $storeFilter === '__none' ? 'active' : '' }}">Sin tienda</button>
                    @foreach ($stores as $storeId => $storeName)
                        <button wire:click="$set('storeFilter', '{{ $storeId }}')" @click="openMenu = null"
                                class="md-chip-menu__item {{ $storeFilter === $storeId ? 'active' : '' }}">{{ $storeName }}</button>
                    @endforeach
                </div>
            </div>

            <div class="md-chip-menu" :class="{ 'open': openMenu === 'price' }">
                <button @click="openMenu = openMenu === 'price' ? null : 'price'"
                        class="md-chip md-chip-filter {{ $priceFilter ? 'selected' : '' }}">
                    <i class="bi bi-currency-dollar"></i> {{ ['with' => 'Con precio', 'without' => 'Sin precio'][$priceFilter] ?? 'Precio' }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'price'" x-transition x-cloak class="md-chip-menu__dropdown">
                    <button wire:click="$set('priceFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $priceFilter === '' ? 'active' : '' }}">Todos</button>
                    <button wire:click="$set('priceFilter', 'with')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $priceFilter === 'with' ? 'active' : '' }}">Con precio</button>
                    <button wire:click="$set('priceFilter', 'without')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $priceFilter === 'without' ? 'active' : '' }}">Sin precio</button>
                </div>
            </div>

            <div class="md-chip-menu" :class="{ 'open': openMenu === 'cart' }">
                <button @click="openMenu = openMenu === 'cart' ? null : 'cart'"
                        class="md-chip md-chip-filter {{ $cartFilter ? 'selected' : '' }}">
                    <i class="bi bi-cart3"></i> {{ ['yes' => 'En la lista', 'no' => 'Fuera de la lista'][$cartFilter] ?? 'Compras' }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'cart'" x-transition x-cloak class="md-chip-menu__dropdown">
                    <button wire:click="$set('cartFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $cartFilter === '' ? 'active' : '' }}">Todos</button>
                    <button wire:click="$set('cartFilter', 'yes')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $cartFilter === 'yes' ? 'active' : '' }}">En la lista</button>
                    <button wire:click="$set('cartFilter', 'no')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $cartFilter === 'no' ? 'active' : '' }}">Fuera de la lista</button>
                </div>
            </div>

            <button wire:click="$set('dataFilter', '{{ $dataFilter === 'pending' ? '' : 'pending' }}')"
                    class="md-chip md-chip-filter {{ $dataFilter === 'pending' ? 'selected' : '' }}">
                <i class="bi bi-exclamation-diamond"></i> Pendientes de completar
            </button>

            @if ($activeFilters > 0)
                <button wire:click="clearFilters" class="md-chip md-chip-assist">
                    <i class="bi bi-x-lg"></i> Limpiar
                </button>
            @endif
            </div>
        </x-slot:filters>
    @if ($grouped->isEmpty())
        <div class="md-card-elevated p-4 text-center">
            <i class="bi bi-basket" style="font-size: 2rem; color: var(--md-sys-color-outline);"></i>
            <p class="md-body-large mt-2" style="color: var(--md-sys-color-on-surface-variant);">
                {{ $search || $activeFilters ? 'No se encontraron ingredientes con esos filtros.' : 'Aún no tienes ingredientes. ¡Agrega el primero!' }}
            </p>
        </div>
    @else
        @foreach ($grouped as $categoryKey => $groupItems)
            <details class="md-card-elevated mb-2" open>
                <summary class="p-3 d-flex justify-content-between align-items-center" style="cursor: pointer; list-style: none;">
                    <span class="md-title-small" style="color: var(--md-sys-color-on-surface);">
                        <i class="bi bi-tag"></i>
                        {{ $this->categoryOptions[$categoryKey] ?? $categoryKey ?: 'Sin categoría' }}
                    </span>
                    <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $groupItems->count() }}</span>
                </summary>
                <div class="px-3 pb-3">
                    @foreach ($groupItems as $item)
                        <div class="py-2" style="border-top: 1px solid var(--md-sys-color-outline-variant);">
                            <div class="d-flex align-items-center gap-2">
                                <button wire:click="toggleNextPurchase('{{ $item->id }}')" class="md-btn-icon md-btn-icon--small" title="{{ $item->next_purchase ? 'Quitar de compras' : 'Agregar a compras' }}">
                                    <i class="bi bi-{{ $item->next_purchase ? 'cart-check-fill' : 'cart-plus' }}" style="{{ $item->next_purchase ? 'color: var(--md-sys-color-primary);' : '' }}"></i>
                                </button>

                                <div class="flex-grow-1" style="cursor: pointer;" wire:click="openForm('{{ $item->id }}')">
                                    <span class="md-body-medium" style="color: var(--md-sys-color-on-surface);">{{ $item->name }}</span>
                                    @if ($item->base_unit)
                                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">({{ $item->baseUnitLabel() }})</span>
                                    @else
                                        <span class="md-chip md-chip--small ingredient-flag" title="Define la unidad base: g, ml o unidad">Sin unidad base</span>
                                    @endif
                                </div>

                                @if ($item->stock > 0)
                                    <span class="md-label-small {{ $item->isBelowMinimum() ? 'ingredient-flag' : '' }}" style="color: var(--md-sys-color-on-surface-variant);" title="{{ $item->isBelowMinimum() ? 'Por debajo del mínimo' : 'En stock' }}">
                                        <i class="bi bi-box-seam"></i> {{ $item->formatQuantity($item->stock) }}
                                    </span>
                                @endif

                                @if ($item->variants->isNotEmpty())
                                    <a href="{{ route('meals.compare', $item) }}" wire:navigate class="md-btn-icon md-btn-icon--small" title="Comparar precios" aria-label="Comparar precios de {{ $item->name }}">
                                        <i class="bi bi-bar-chart-steps"></i>
                                    </a>
                                @endif
                            </div>

                            {{-- Variants preview --}}
                            @if ($item->variants->isNotEmpty())
                                <div class="d-flex flex-wrap gap-1 mt-1 ms-4 ps-2">
                                    @foreach ($item->variants as $variant)
                                        @php
                                            $cheapest = $variant->latestPrices()->sortBy(fn ($p) => (float) $p->amount)->first();
                                            $perBase = $variant->pricePerBase($cheapest, $item->base_unit);
                                        @endphp
                                        <span class="ingredient-variant-chip {{ $variant->isComparable() ? '' : 'is-pending' }}" title="{{ $variant->isComparable() ? '' : 'Pendiente de completar: falta el contenido' }}">
                                            @if ($variant->is_preferred)<i class="bi bi-star-fill" aria-label="Preferida"></i>@endif
                                            {{ $variant->label($item->base_unit) }}
                                            @if ($cheapest) · {{ $cheapest->store?->name }} ${{ number_format($cheapest->amount, 0, ',', '.') }}@endif
                                            @if ($perBase !== null) <small>(${{ number_format($perBase, 0, ',', '.') }}/{{ \App\Services\Meal\UnitConverter::comparisonLabel($item->base_unit) }})</small>@endif
                                        </span>
                                    @endforeach
                                </div>
                            @endif
                        </div>
                    @endforeach
                </div>
            </details>
        @endforeach
    @endif
    </x-ui.management-card>

    <x-slot:rail>
        <x-context-widget title="Resumen" icon="bi-basket" tone="success">
            <div class="text-center mb-2">
                <span style="font-size: 2rem; font-weight: 700; color: var(--md-sys-color-primary);">{{ $totalItems }}</span>
                <span class="md-body-small d-block" style="color: var(--md-sys-color-on-surface-variant);">ingredientes</span>
            </div>
            <dl class="md-context-list">
                <div><dt>Para comprar</dt><dd>{{ $nextPurchaseCount }}</dd></div>
                <div><dt>Sin stock</dt><dd>{{ $lowStockCount }}</dd></div>
            </dl>
        </x-context-widget>

        @if ($byCategory->isNotEmpty())
            <x-context-widget title="Por categoría" icon="bi-tag">
                <dl class="md-context-list">
                    @foreach ($byCategory as $cat => $count)
                        <div><dt>{{ $this->categoryOptions[$cat] ?? $cat ?: 'Sin categoría' }}</dt><dd>{{ $count }}</dd></div>
                    @endforeach
                </dl>
            </x-context-widget>
        @endif

        <x-context-widget title="Vistas relacionadas" icon="bi-signpost-split">
            <div class="md-context-links">
                <a href="{{ route('meals.recipes') }}"><i class="bi bi-book"></i> Recetas</a>
                <a href="{{ route('meals.shopping') }}"><i class="bi bi-cart3"></i> Compras</a>
            </div>
        </x-context-widget>
    </x-slot:rail>

    <x-ui.form-dialog :open="$showForm" close="closeForm" submit-action="save" id="ingredient-dialog"
                      :title="$editingId ? 'Editar ingrediente' : 'Agregar ingrediente'" icon="bi-basket"
                      :submit="$editingId ? 'Actualizar' : 'Guardar'"
                      :sections="[
                          'basic' => ['label' => 'Información básica', 'icon' => 'bi-basket', 'error' => $errors->hasAny(['name', 'baseUnit', 'gramsPerPiece'])],
                          'inventory' => ['label' => 'Inventario', 'icon' => 'bi-box-seam', 'error' => $errors->hasAny(['stock', 'minStock', 'toBuy'])],
                          'nutrition' => ['label' => 'Nutrición', 'icon' => 'bi-fire', 'error' => $errors->hasAny(['kcal', 'protein', 'carbs', 'fat'])],
                          'variants' => ['label' => 'Variantes y precios', 'icon' => 'bi-shop', 'error' => $errors->has('variants.*')],
                          'aliases' => ['label' => 'Alias y equivalencias', 'icon' => 'bi-tags', 'error' => $errors->has('aliases') || $errors->has('aliases.*')],
                      ]">
        @php
            $unitShort = ['g' => 'g', 'ml' => 'ml', 'unit' => 'und'][$baseUnit] ?? '';
            $nutritionBasis = ['g' => 'por 100 g', 'ml' => 'por 100 ml', 'unit' => 'por unidad'][$baseUnit] ?? '';
        @endphp
        <x-ui.form-dialog-section name="basic" title="Información básica" description="El nombre es el producto genérico, sin marca ni tamaño: «Aceite vegetal», no «Aceite Imatá 900 ml».">
            <div class="d-flex flex-column gap-3">
                <x-ui.field name="name" label="Nombre" :required="true" wire:model.live.debounce.400ms="name" />
                @if ($nameSuggestions->isNotEmpty())
                    <p class="md-supporting-text ingredient-similar" role="status">
                        <i class="bi bi-info-circle" aria-hidden="true"></i> Ya tienes productos parecidos: {{ $nameSuggestions->implode(', ') }}.
                    </p>
                @endif
                <div class="md-field-pair">
                    <x-ui.select name="category" label="Categoría" placeholder="Sin categoría" :options="$this->categoryOptions" :selected="$category" wire:model="category" />
                    <x-ui.select name="baseUnit" label="Unidad base" placeholder="Elige g, ml o unidad" :required="true"
                                 :options="\App\Models\ShoppingItem::BASE_UNITS" :selected="$baseUnit" :disabled="$baseUnitLocked"
                                 :help="$baseUnitLocked ? 'La unidad base no cambia una vez definida.' : 'Todo lo de este producto se guarda en esta unidad.'"
                                 wire:model.live="baseUnit" />
                </div>
                @if ($baseUnit === 'g')
                    <x-ui.field name="gramsPerPiece" label="Gramos por pieza (opcional)" type="number" step="0.001" min="0"
                                help="Para productos que se compran por peso pero se cuentan por pieza, como el aguacate." wire:model="gramsPerPiece" />
                @endif
            </div>
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="inventory" title="Inventario" :description="$unitShort ? 'Cantidades en '.$unitShort.'.' : 'Elige primero la unidad base.'">
            <div class="d-flex flex-column gap-3">
                <div class="md-field-pair">
                    <x-ui.field name="stock" label="Stock en casa" type="number" step="0.001" min="0" wire:model="stock" />
                    <x-ui.field name="minStock" label="Stock mínimo" type="number" step="0.001" min="0" wire:model="minStock" />
                </div>
                <x-ui.field name="toBuy" label="Por comprar (paquetes)" type="number" step="0.001" min="0" wire:model="toBuy" />
                <x-ui.field name="consumeBy" label="Consumir antes" type="date" wire:model="consumeBy" />
                <label class="d-flex align-items-center gap-2" style="cursor: pointer;"><input type="checkbox" wire:model="nextPurchase" class="md-checkbox"><span class="md-body-medium">Incluir en lista de compras</span></label>
            </div>
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="nutrition" title="Nutrición" :description="$nutritionBasis ? 'Valores '.$nutritionBasis.'. Las recetas los usan para calcular sus calorías.' : 'Elige primero la unidad base.'">
            <div class="d-flex flex-column gap-3">
                <div class="md-field-pair">
                    <x-ui.field name="kcal" label="Calorías (kcal)" type="number" step="0.01" min="0" wire:model="kcal" />
                    <x-ui.field name="protein" label="Proteína (g)" type="number" step="0.01" min="0" wire:model="protein" />
                </div>
                <div class="md-field-pair">
                    <x-ui.field name="carbs" label="Carbohidratos (g)" type="number" step="0.01" min="0" wire:model="carbs" />
                    <x-ui.field name="fat" label="Grasa (g)" type="number" step="0.01" min="0" wire:model="fat" />
                </div>
            </div>
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="variants" title="Variantes y precios" description="Cada variante es una marca, empaque y contenido concretos; sus precios llevan tienda, fecha y fuente.">
            <datalist id="ingredient-brands-list">
                @foreach ($brands as $brandName)<option value="{{ $brandName }}">@endforeach
            </datalist>
            @forelse ($variants as $index => $variant)
                <article class="meal-variant-card" wire:key="variant-{{ $variant['id'] ?? 'new-'.$index }}">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="md-label-large">Variante {{ $index + 1 }}</span>
                        <div class="d-flex align-items-center gap-2">
                            <label class="md-checkbox">
                                <input type="checkbox" wire:model="variants.{{ $index }}.is_preferred"> Preferida
                            </label>
                            <button wire:click="removeVariant({{ $index }})" type="button" class="md-btn-icon md-btn-icon--small md-btn-danger" aria-label="Quitar variante"><i class="bi bi-trash" aria-hidden="true"></i></button>
                        </div>
                    </div>
                    <div class="d-flex flex-column gap-2">
                        <div class="md-field-pair">
                            <x-ui.field name="variants.{{ $index }}.brand" label="Marca" id="var-brand-{{ $index }}" list="ingredient-brands-list" autocomplete="off" wire:model="variants.{{ $index }}.brand" />
                            <x-ui.select name="variants.{{ $index }}.packaging" label="Empaque" id="var-pack-{{ $index }}" placeholder="Sin definir"
                                         :options="\App\Models\ShoppingItemVariant::PACKAGINGS" :selected="$variant['packaging']" wire:model="variants.{{ $index }}.packaging" />
                        </div>
                        <div class="md-field-pair">
                            <x-ui.field name="variants.{{ $index }}.content" label="Contenido" type="number" step="0.001" min="0" id="var-content-{{ $index }}"
                                        help="Sin contenido, la variante queda pendiente y no entra en las comparaciones." wire:model="variants.{{ $index }}.content" />
                            <x-ui.select name="variants.{{ $index }}.content_unit" label="Unidad del contenido" id="var-content-unit-{{ $index }}"
                                         :options="\App\Livewire\Meal\MealIngredients::CONTENT_UNITS[$baseUnit] ?? []" :selected="$variant['content_unit']" :disabled="$baseUnit === ''"
                                         wire:model="variants.{{ $index }}.content_unit" />
                        </div>
                        <div class="md-field-pair">
                            <x-ui.field name="variants.{{ $index }}.units_per_pack" label="Unidades por paquete" type="number" min="1" id="var-units-{{ $index }}"
                                        help="Ej.: 5 arepas en 400 g." wire:model="variants.{{ $index }}.units_per_pack" />
                            <x-ui.field name="variants.{{ $index }}.barcode" label="Código de barras" id="var-barcode-{{ $index }}" wire:model="variants.{{ $index }}.barcode" />
                        </div>
                        <x-ui.field name="variants.{{ $index }}.kcal" label="Calorías propias (opcional, {{ $nutritionBasis ?: 'por unidad base' }})" type="number" step="0.01" min="0" id="var-kcal-{{ $index }}"
                                    help="Solo si esta marca difiere del producto genérico." wire:model="variants.{{ $index }}.kcal" />

                        <div class="ingredient-prices">
                            <span class="md-label-large">Precios</span>
                            @forelse ($variant['prices'] as $priceIndex => $price)
                                <div class="ingredient-price-row" wire:key="price-{{ $index }}-{{ $price['id'] ?? 'new-'.$priceIndex }}">
                                    <x-ui.select name="variants.{{ $index }}.prices.{{ $priceIndex }}.store_id" label="Tienda" id="price-store-{{ $index }}-{{ $priceIndex }}" placeholder="Elige la tienda"
                                                 :options="$stores->all()" :selected="$price['store_id']" wire:model="variants.{{ $index }}.prices.{{ $priceIndex }}.store_id" />
                                    <x-ui.field name="variants.{{ $index }}.prices.{{ $priceIndex }}.amount" label="Precio" type="number" step="0.01" min="0" id="price-amount-{{ $index }}-{{ $priceIndex }}" wire:model="variants.{{ $index }}.prices.{{ $priceIndex }}.amount" />
                                    <x-ui.field name="variants.{{ $index }}.prices.{{ $priceIndex }}.observed_on" label="Fecha" type="date" id="price-date-{{ $index }}-{{ $priceIndex }}" wire:model="variants.{{ $index }}.prices.{{ $priceIndex }}.observed_on" />
                                    <x-ui.select name="variants.{{ $index }}.prices.{{ $priceIndex }}.source" label="Fuente" id="price-source-{{ $index }}-{{ $priceIndex }}"
                                                 :options="\App\Models\ShoppingItemPrice::SOURCES" :selected="$price['source']" wire:model="variants.{{ $index }}.prices.{{ $priceIndex }}.source" />
                                    <div class="ingredient-price-row__actions">
                                        <label class="md-checkbox">
                                            <input type="checkbox" wire:model="variants.{{ $index }}.prices.{{ $priceIndex }}.verified"> Verificado
                                        </label>
                                        <button wire:click="removePrice({{ $index }}, {{ $priceIndex }})" type="button" class="md-btn-icon md-btn-icon--small md-btn-danger" aria-label="Quitar precio"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
                                    </div>
                                </div>
                            @empty
                                <p class="md-body-small mb-0 meal-muted">Sin precios registrados.</p>
                            @endforelse
                            <div class="d-flex flex-wrap gap-2">
                                <button wire:click="addPrice({{ $index }})" type="button" class="md-btn-text" @disabled($stores->isEmpty())><i class="bi bi-plus-lg" aria-hidden="true"></i> Agregar precio</button>
                                <button type="button" class="md-btn-text" x-on:click="$dispatch('open-store-catalog')"><i class="bi bi-shop" aria-hidden="true"></i> {{ $stores->isEmpty() ? 'Crea primero una tienda' : 'Gestionar tiendas' }}</button>
                            </div>
                        </div>
                    </div>
                </article>
            @empty
                <div class="md-form-empty"><i class="bi bi-shop-window" aria-hidden="true"></i><p>No hay variantes registradas. Agrega una para guardar marca, contenido y precios por tienda.</p></div>
            @endforelse
            <button wire:click="addVariant" type="button" class="md-btn-text mt-2" @disabled($baseUnit === '')><i class="bi bi-plus-lg" aria-hidden="true"></i> Agregar variante</button>
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="aliases" title="Alias y equivalencias" description="Nombres alternativos que reconocerá el asistente, por ejemplo «arroz» para «Arroz blanco».">
            @forelse ($aliases as $index => $alias)
                <div class="d-flex align-items-start gap-2 mb-2" wire:key="alias-{{ $alias['id'] ?? 'new-'.$index }}">
                    <div class="flex-grow-1">
                        <x-ui.field name="aliases.{{ $index }}.alias" label="Alias {{ $index + 1 }}" id="ingredient-alias-{{ $index }}" wire:model="aliases.{{ $index }}.alias" />
                    </div>
                    <button wire:click="removeAlias({{ $index }})" type="button" class="md-btn-icon md-btn-icon--small md-btn-danger mt-2" aria-label="Quitar alias"><i class="bi bi-trash" aria-hidden="true"></i></button>
                </div>
            @empty
                <div class="md-form-empty" style="min-height: 96px;"><i class="bi bi-tags" aria-hidden="true"></i><p>Este ingrediente aún no tiene nombres alternativos.</p></div>
            @endforelse
            @error('aliases')<p class="md-supporting-text" role="alert">{{ $message }}</p>@enderror
            <button wire:click="addAlias" type="button" class="md-btn-text mt-2"><i class="bi bi-plus-lg" aria-hidden="true"></i> Agregar alias</button>

            @if ($editingId)
                <div class="mt-4">
                    <x-ui.destructive-action label="Eliminar ingrediente" action="delete('{{ $editingId }}')"
                                             title="Eliminar ingrediente" message="El ingrediente y sus variantes se eliminan de forma permanente." />
                </div>
            @endif
        </x-ui.form-dialog-section>
    </x-ui.form-dialog>
</x-module-shell>
