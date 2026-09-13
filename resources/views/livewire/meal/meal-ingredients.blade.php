<x-module-shell module="meals">
    <x-slot:actions>
        <livewire:meal.bulk-ingredient-assistant context="ingredients" />
        <x-module-actions :primary="['label' => 'Agregar ingrediente', 'icon' => 'bi-basket', 'action' => 'openForm']" />
    </x-slot:actions>

    <x-ui.management-card id="meal-ingredients" title="Catálogo de ingredientes" icon="bi-basket" :count="'('.$ingredients->total().' / '.$catalogTotal.')'"
                          search="search" search-placeholder="Buscar ingredientes" :active-filters="$categoryFilter !== '' ? 1 : 0"
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
            </div>
        </x-slot:filters>
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
                          'basic' => ['label' => 'Información básica', 'icon' => 'bi-basket', 'error' => $errors->has('name')],
                          'inventory' => ['label' => 'Inventario', 'icon' => 'bi-box-seam'],
                          'variants' => ['label' => 'Variantes por tienda', 'icon' => 'bi-shop'],
                          'aliases' => ['label' => 'Alias y equivalencias', 'icon' => 'bi-tags', 'error' => $errors->has('aliases') || $errors->has('aliases.*')],
                      ]">
        <x-ui.form-dialog-section name="basic" title="Información básica">
            <div class="d-flex flex-column gap-3">
                <x-ui.field name="name" label="Nombre" :required="true" wire:model="name" />
                <div class="md-field-pair">
                    <x-ui.select name="category" label="Categoría" placeholder="Sin categoría" :options="$this->categoryOptions" :selected="$category" wire:model="category" />
                    <x-ui.field name="unit" label="Unidad base" wire:model="unit" />
                </div>
            </div>
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="inventory" title="Inventario">
            <div class="d-flex flex-column gap-3">
                <div class="md-field-pair">
                    <x-ui.field name="stock" label="Stock" type="number" min="0" wire:model="stock" />
                    <x-ui.field name="toBuy" label="Por comprar" type="number" min="0" wire:model="toBuy" />
                </div>
                <x-ui.field name="consumeBy" label="Consumir antes" type="date" wire:model="consumeBy" />
                <label class="d-flex align-items-center gap-2" style="cursor: pointer;"><input type="checkbox" wire:model="nextPurchase" class="md-checkbox"><span class="md-body-medium">Incluir en lista de compras</span></label>
            </div>
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="variants" title="Variantes por tienda" description="Precio, presentación o código de barras en cada tienda.">
            @forelse ($variants as $index => $variant)
                <article class="meal-variant-card" wire:key="variant-{{ $variant['id'] ?? 'new-'.$index }}">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="md-label-large">Tienda {{ $index + 1 }}</span>
                        <button wire:click="removeVariant({{ $index }})" type="button" class="md-btn-icon md-btn-icon--small md-btn-danger" aria-label="Quitar variante"><i class="bi bi-trash" aria-hidden="true"></i></button>
                    </div>
                    <div class="d-flex flex-column gap-2">
                        <div class="md-field-pair">
                            <x-ui.field name="variants.{{ $index }}.place" label="Tienda" id="var-place-{{ $index }}" wire:model="variants.{{ $index }}.place" />
                            <x-ui.field name="variants.{{ $index }}.price" label="Precio" type="number" step="0.01" min="0" id="var-price-{{ $index }}" wire:model="variants.{{ $index }}.price" />
                        </div>
                        <x-ui.field name="variants.{{ $index }}.presentation" label="Presentación" id="var-pres-{{ $index }}" wire:model="variants.{{ $index }}.presentation" />
                        <x-ui.field name="variants.{{ $index }}.barcode" label="Código de barras" id="var-barcode-{{ $index }}" wire:model="variants.{{ $index }}.barcode" />
                        <x-ui.field name="variants.{{ $index }}.notes" label="Notas" id="var-notes-{{ $index }}" wire:model="variants.{{ $index }}.notes" />
                    </div>
                </article>
            @empty
                <div class="md-form-empty"><i class="bi bi-shop-window" aria-hidden="true"></i><p>No hay variantes registradas. Agrega una tienda para guardar precio, presentación o código de barras.</p></div>
            @endforelse
            <button wire:click="addVariant" type="button" class="md-btn-text mt-2"><i class="bi bi-plus-lg" aria-hidden="true"></i> Agregar variante</button>
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
