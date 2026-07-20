<x-module-shell module="meals">
    {{-- Search + Filters --}}
    <div x-data="{ openMenu: null }" @click.outside="openMenu = null" class="mb-3">
        <div class="md-search-bar mb-2">
            <i class="bi bi-search md-search-bar__icon"></i>
            <input type="text" wire:model.live.debounce.300ms="search"
                   class="md-search-bar__input" placeholder="Buscar en lista de compras...">
            @if($search)
                <button wire:click="$set('search', '')" class="md-search-bar__clear">
                    <i class="bi bi-x-lg"></i>
                </button>
            @endif
        </div>

        <div class="md-chip-rail">
            <button wire:click="toggleGroupBy"
                    class="md-chip md-chip-filter">
                <i class="bi bi-{{ $groupBy === 'category' ? 'tag' : 'geo-alt' }}"></i>
                {{ $groupBy === 'category' ? 'Por categoría' : 'Por tienda' }}
            </button>

            @if ($places->isNotEmpty())
                <div class="md-chip-rail__divider"></div>

                <div class="md-chip-menu" :class="{ 'open': openMenu === 'place' }">
                    <button @click="openMenu = openMenu === 'place' ? null : 'place'"
                            class="md-chip md-chip-filter {{ $placeFilter ? 'selected' : '' }}">
                        {{ $placeFilter ?: 'Tienda' }}
                        <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                    </button>
                    <div x-show="openMenu === 'place'" x-transition x-cloak class="md-chip-menu__dropdown">
                        <button wire:click="$set('placeFilter', '')" @click="openMenu = null"
                                class="md-chip-menu__item {{ $placeFilter === '' ? 'active' : '' }}">Todas</button>
                        @foreach ($places as $p)
                            <button wire:click="$set('placeFilter', '{{ $p }}')" @click="openMenu = null"
                                    class="md-chip-menu__item {{ $placeFilter === $p ? 'active' : '' }}">{{ $p }}</button>
                        @endforeach
                    </div>
                </div>
            @endif
        </div>
    </div>

    {{-- Needed from meal plan --}}
    @if ($neededItems->isNotEmpty())
        <div class="md-card-elevated p-3 mb-3" style="border-left: 3px solid var(--md-sys-color-tertiary);">
            <h3 class="md-title-small mb-2" style="color: var(--md-sys-color-tertiary);">
                <i class="bi bi-calendar-week"></i> Necesarios esta semana (desde recetas)
            </h3>
            <div class="d-flex flex-wrap gap-2">
                @foreach ($neededItems as $needed)
                    @php $item = $needed['shopping_item']; @endphp
                    @if ($item)
                        <span class="md-chip md-chip--small {{ $item->next_purchase ? '' : 'md-chip--outlined' }}">
                            {{ $item->name }}
                            <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">
                                ({{ $needed['quantity'] !== null ? rtrim(rtrim(number_format($needed['quantity'], 2, '.', ''), '0'), '.') : '?' }} {{ $needed['unit'] ?? '' }})
                            </span>
                            @if (!$item->next_purchase)
                                <button wire:click="toggleNextPurchase('{{ $item->id }}')" class="md-btn-icon md-btn-icon--small" title="Agregar a compras" style="margin: -4px -4px -4px 2px;">
                                    <i class="bi bi-plus-circle"></i>
                                </button>
                            @endif
                        </span>
                    @endif
                @endforeach
            </div>
        </div>
    @endif

    {{-- Shopping list --}}
    @if ($grouped->isEmpty())
        <div class="md-card-elevated p-4 text-center">
            <i class="bi bi-cart3" style="font-size: 2rem; color: var(--md-sys-color-outline);"></i>
            <p class="md-body-large mt-2" style="color: var(--md-sys-color-on-surface-variant);">
                No hay artículos en tu lista de compras.
            </p>
            <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant);">
                Marca ingredientes como "próxima compra" desde el tab <a href="{{ route('meals.ingredients') }}" class="md-link">Ingredientes</a>.
            </p>
        </div>
    @else
        <p class="md-label-medium mb-2" style="color: var(--md-sys-color-on-surface-variant);">
            {{ $totalItems }} {{ $totalItems === 1 ? 'artículo' : 'artículos' }} por comprar
        </p>

        @foreach ($grouped as $groupName => $groupItems)
            <details class="md-card-elevated mb-2" open>
                <summary class="p-3 d-flex justify-content-between align-items-center" style="cursor: pointer; list-style: none;">
                    <span class="md-title-small" style="color: var(--md-sys-color-on-surface);">
                        <i class="bi bi-{{ $groupBy === 'category' ? 'tag' : 'geo-alt' }}"></i>
                        @if ($groupBy === 'category')
                            {{ $this->categoryOptions[$groupName] ?? $groupName ?: 'Sin categoría' }}
                        @else
                            {{ $groupName ?: 'Sin tienda' }}
                        @endif
                    </span>
                    <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $groupItems->count() }}</span>
                </summary>
                <div class="px-3 pb-3">
                    @foreach ($groupItems as $item)
                        <div class="py-2" style="border-top: 1px solid var(--md-sys-color-outline-variant);">
                            <div class="d-flex align-items-center gap-2">
                                <button wire:click="toggleNextPurchase('{{ $item->id }}')" class="md-btn-icon md-btn-icon--small" title="Quitar de la lista">
                                    <i class="bi bi-check-circle-fill" style="color: var(--md-sys-color-primary);"></i>
                                </button>

                                <div class="flex-grow-1">
                                    <span class="md-body-medium" style="color: var(--md-sys-color-on-surface);">{{ $item->name }}</span>
                                    @if ($item->unit)
                                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">({{ $item->unit }})</span>
                                    @endif
                                    @if ($item->to_buy > 0)
                                        <span class="md-label-small" style="color: var(--md-sys-color-primary);"> × {{ $item->to_buy }}</span>
                                    @endif
                                </div>

                                @if ($neededItemIds->contains($item->id))
                                    <span class="md-chip md-chip--small" style="background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container);" title="Necesario por receta">
                                        <i class="bi bi-calendar-week"></i>
                                    </span>
                                @endif
                            </div>

                            {{-- Variant prices for reference --}}
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
        <x-context-widget title="Resumen" icon="bi-cart3" tone="success">
            <div class="text-center mb-2">
                <span style="font-size: 2rem; font-weight: 700; color: var(--md-sys-color-primary);">{{ $totalItems }}</span>
                <span class="md-body-small d-block" style="color: var(--md-sys-color-on-surface-variant);">por comprar</span>
            </div>
            @if ($neededCount > 0)
                <dl class="md-context-list">
                    <div><dt>Necesarios (recetas)</dt><dd>{{ $neededCount }}</dd></div>
                </dl>
            @endif
        </x-context-widget>

        <x-context-widget title="Vistas relacionadas" icon="bi-signpost-split">
            <div class="md-context-links">
                <a href="{{ route('meals.ingredients') }}"><i class="bi bi-basket"></i> Ingredientes</a>
                <a href="{{ route('meals.recipes') }}"><i class="bi bi-book"></i> Recetas</a>
            </div>
        </x-context-widget>
    </x-slot:rail>
</x-module-shell>
