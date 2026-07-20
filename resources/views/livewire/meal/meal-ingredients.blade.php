<x-module-shell module="meals" x-data="{ showDialog: $wire.entangle('showForm') }">
    <x-slot:actions>
        <livewire:meal.bulk-ingredient-assistant context="ingredients" />
        <button wire:click="openForm" class="md-btn-filled-tonal">
            <i class="bi bi-plus-lg"></i> Nuevo ingrediente
        </button>
    </x-slot:actions>

    {{-- Search + Filters --}}
    <div x-data="{ openMenu: null }" @click.outside="openMenu = null" class="mb-3">
        <div class="md-search-bar mb-2">
            <i class="bi bi-search md-search-bar__icon"></i>
            <input type="text" wire:model.live.debounce.300ms="search"
                   class="md-search-bar__input" placeholder="Buscar ingredientes...">
            @if($search)
                <button wire:click="$set('search', '')" class="md-search-bar__clear">
                    <i class="bi bi-x-lg"></i>
                </button>
            @endif
        </div>

        <div class="md-chip-rail">
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
        </div>
    </div>

    {{-- Items grouped by category --}}
    @if ($grouped->isEmpty())
        <div class="md-card-elevated p-4 text-center">
            <i class="bi bi-basket" style="font-size: 2rem; color: var(--md-sys-color-outline);"></i>
            <p class="md-body-large mt-2" style="color: var(--md-sys-color-on-surface-variant);">
                {{ $search || $categoryFilter ? 'No se encontraron ingredientes con esos filtros.' : 'Aún no tienes ingredientes. ¡Agrega el primero!' }}
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
                                    @if ($item->unit)
                                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">({{ $item->unit }})</span>
                                    @endif
                                </div>

                                @if ($item->stock > 0)
                                    <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);" title="En stock">
                                        <i class="bi bi-box-seam"></i> {{ $item->stock }}
                                    </span>
                                @endif

                                @if ($item->variants_count > 0)
                                    <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">
                                        <i class="bi bi-shop"></i> {{ $item->variants_count }}
                                    </span>
                                @endif
                            </div>

                            {{-- Variants preview --}}
                            @if ($item->variants->isNotEmpty())
                                <div class="d-flex flex-wrap gap-1 mt-1 ms-4 ps-2">
                                    @foreach ($item->variants as $variant)
                                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant); background: var(--md-sys-color-surface-container); padding: 2px 6px; border-radius: 4px;">
                                            @if ($variant->place){{ $variant->place }}@endif
                                            @if ($variant->presentation) · {{ $variant->presentation }}@endif
                                            @if ($variant->price) · ${{ number_format($variant->price, 2) }}@endif
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

    @teleport('body')
        <div x-show="showDialog" x-cloak>
            <div class="md-dialog-scrim" @click="$wire.closeForm()"></div>
            <section wire:key="ingredient-dialog-{{ $editingId ?? 'new' }}" class="md-dialog md-dialog--large" role="dialog" aria-modal="true" aria-labelledby="ingredient-dialog-title" @click.stop>
                <header class="md-dialog-header">
                    <div>
                        <h2 id="ingredient-dialog-title" class="md-headline-small mb-1">{{ $editingId ? 'Editar ingrediente' : 'Nuevo ingrediente' }}</h2>
                        <p class="md-body-medium mb-0">Información de inventario y opciones de compra por tienda</p>
                    </div>
                    <button type="button" wire:click="closeForm" class="md-btn-icon" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
                </header>

                <div class="md-dialog-content md-dialog-layout md-dialog-layout--equal">
                    <div class="d-flex flex-column gap-3">
                        <section class="md-form-section">
                            <div class="md-form-section__header"><div><i class="bi bi-basket"></i><span>Información general</span></div></div>
                            <div class="d-flex flex-column gap-3">
                                <div class="md-text-field">
                                    <input type="text" wire:model="name" placeholder=" " id="ingredient-name">
                                    <label for="ingredient-name">Nombre *</label>
                                    @error('name')<small class="text-danger">{{ $message }}</small>@enderror
                                </div>
                                <div class="row g-3">
                                    <div class="col-12 col-sm-7"><div class="md-text-field"><select wire:model="category" id="ingredient-category"><option value="">Sin categoría</option>@foreach ($this->categoryOptions as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach</select><label for="ingredient-category">Categoría</label></div></div>
                                    <div class="col-12 col-sm-5"><div class="md-text-field"><input type="text" wire:model="unit" placeholder=" " id="ingredient-unit"><label for="ingredient-unit">Unidad base</label></div></div>
                                </div>
                            </div>
                        </section>

                        <section class="md-form-section">
                            <div class="md-form-section__header"><div><i class="bi bi-box-seam"></i><span>Inventario</span></div></div>
                            <div class="row g-3">
                                <div class="col-6"><div class="md-text-field"><input type="number" wire:model="stock" placeholder=" " id="ingredient-stock" min="0"><label for="ingredient-stock">Stock</label></div></div>
                                <div class="col-6"><div class="md-text-field"><input type="number" wire:model="toBuy" placeholder=" " id="ingredient-to-buy" min="0"><label for="ingredient-to-buy">Por comprar</label></div></div>
                                <div class="col-12"><div class="md-text-field"><input type="date" wire:model="consumeBy" placeholder=" " id="ingredient-consume-by"><label for="ingredient-consume-by">Consumir antes</label></div></div>
                            </div>
                            <label class="d-flex align-items-center gap-2 mt-3" style="cursor: pointer;"><input type="checkbox" wire:model="nextPurchase" class="md-checkbox"><span class="md-body-medium">Incluir en lista de compras</span></label>
                        </section>

                        <section class="md-form-section">
                            <div class="md-form-section__header">
                                <div><i class="bi bi-tags"></i><span>Alias y equivalencias</span><span class="md-chip md-chip--small">{{ count($aliases) }}</span></div>
                                <button wire:click="addAlias" type="button" class="md-btn-text md-btn-text--small"><i class="bi bi-plus-lg"></i> Agregar</button>
                            </div>
                            <p class="md-body-small mb-3" style="color: var(--md-sys-color-on-surface-variant);">Nombres alternativos que reconocerá el asistente, por ejemplo «arroz» para «Arroz blanco».</p>
                            @forelse ($aliases as $index => $alias)
                                <div class="d-flex align-items-start gap-2 mb-2" wire:key="alias-{{ $alias['id'] ?? 'new-'.$index }}">
                                    <div class="md-text-field flex-grow-1">
                                        <input type="text" wire:model="aliases.{{ $index }}.alias" placeholder=" " id="ingredient-alias-{{ $index }}">
                                        <label for="ingredient-alias-{{ $index }}">Alias {{ $index + 1 }}</label>
                                        @error("aliases.$index.alias")<div class="md-supporting-text">{{ $message }}</div>@enderror
                                    </div>
                                    <button wire:click="removeAlias({{ $index }})" type="button" class="md-btn-icon md-btn-icon--small md-btn-danger mt-2" aria-label="Quitar alias"><i class="bi bi-trash"></i></button>
                                </div>
                            @empty
                                <div class="md-form-empty" style="min-height: 96px;"><i class="bi bi-tags"></i><p>Este ingrediente aún no tiene nombres alternativos.</p></div>
                            @endforelse
                            @error('aliases')<small class="text-danger d-block mt-2">{{ $message }}</small>@enderror
                        </section>
                    </div>

                    <section class="md-form-section">
                        <div class="md-form-section__header">
                            <div><i class="bi bi-shop"></i><span>Variantes por tienda</span><span class="md-chip md-chip--small">{{ count($variants) }}</span></div>
                            <button wire:click="addVariant" type="button" class="md-btn-text md-btn-text--small"><i class="bi bi-plus-lg"></i> Agregar</button>
                        </div>
                        @forelse ($variants as $index => $variant)
                            <article class="meal-variant-card" wire:key="variant-{{ $variant['id'] ?? 'new-'.$index }}">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="md-label-large">Tienda {{ $index + 1 }}</span>
                                    <button wire:click="removeVariant({{ $index }})" type="button" class="md-btn-icon md-btn-icon--small md-btn-danger" aria-label="Quitar variante"><i class="bi bi-trash"></i></button>
                                </div>
                                <div class="row g-2">
                                    <div class="col-7"><div class="md-text-field"><input type="text" wire:model="variants.{{ $index }}.place" placeholder=" " id="var-place-{{ $index }}"><label for="var-place-{{ $index }}">Tienda</label></div></div>
                                    <div class="col-5"><div class="md-text-field"><input type="number" wire:model="variants.{{ $index }}.price" placeholder=" " id="var-price-{{ $index }}" step="0.01" min="0"><label for="var-price-{{ $index }}">Precio</label></div></div>
                                    <div class="col-12"><div class="md-text-field"><input type="text" wire:model="variants.{{ $index }}.presentation" placeholder=" " id="var-pres-{{ $index }}"><label for="var-pres-{{ $index }}">Presentación</label></div></div>
                                    <div class="col-12"><div class="md-text-field"><input type="text" wire:model="variants.{{ $index }}.barcode" placeholder=" " id="var-barcode-{{ $index }}"><label for="var-barcode-{{ $index }}">Código de barras</label></div></div>
                                    <div class="col-12"><div class="md-text-field"><input type="text" wire:model="variants.{{ $index }}.notes" placeholder=" " id="var-notes-{{ $index }}"><label for="var-notes-{{ $index }}">Notas</label></div></div>
                                </div>
                            </article>
                        @empty
                            <div class="md-form-empty"><i class="bi bi-shop-window"></i><p>No hay variantes registradas. Agrega una tienda para guardar precio, presentación o código de barras.</p></div>
                        @endforelse
                    </section>
                </div>

                <footer class="md-dialog-actions">
                    @if ($editingId)<button type="button" wire:click="delete('{{ $editingId }}')" wire:confirm="¿Eliminar este ingrediente y sus variantes?" class="md-btn-text md-btn-danger"><i class="bi bi-trash"></i> Eliminar</button>@endif
                    <span class="md-dialog-actions__spacer"></span>
                    <button type="button" wire:click="closeForm" class="md-btn-text">Cancelar</button>
                    <button type="button" wire:click="save" class="md-btn-filled"><i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}</button>
                </footer>
            </section>
        </div>
    @endteleport
</x-module-shell>
