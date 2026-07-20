<x-module-shell module="meals">
    <x-slot:actions>
        <livewire:meal.bulk-ingredient-assistant context="shopping" />
    </x-slot:actions>

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
            <button wire:click="setViewMode('compact')"
                    class="md-chip md-chip-filter {{ $viewMode === 'compact' ? 'selected' : '' }}">
                <i class="bi bi-list"></i> Compacta
            </button>
            <button wire:click="setViewMode('grouped')"
                    class="md-chip md-chip-filter {{ $viewMode === 'grouped' ? 'selected' : '' }}">
                <i class="bi bi-collection"></i> Agrupada
            </button>

            @if ($viewMode === 'grouped')
                <div class="md-chip-rail__divider"></div>

                <button wire:click="toggleGroupBy" class="md-chip md-chip-filter selected">
                    <i class="bi bi-{{ $groupBy === 'category' ? 'tag' : 'geo-alt' }}"></i>
                    {{ $groupBy === 'category' ? 'Por categoría' : 'Por tienda' }}
                </button>
            @endif

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
        <details class="shopping-needed mb-3">
            <summary>
                <span class="shopping-needed__icon"><i class="bi bi-calendar-week"></i></span>
                <span><strong>{{ $neededCount }} necesarios esta semana</strong><small>Calculados desde tus recetas</small></span>
                <i class="bi bi-chevron-down shopping-needed__arrow"></i>
            </summary>
            <div class="shopping-needed__content">
                @foreach ($neededItems as $needed)
                    @php $item = $needed['shopping_item']; @endphp
                    @if ($item)
                        <span class="shopping-needed__item {{ $item->next_purchase ? 'is-added' : '' }}">
                            {{ $item->name }}
                            <small>{{ $needed['quantity'] !== null ? rtrim(rtrim(number_format($needed['quantity'], 2, '.', ''), '0'), '.') : '?' }} {{ $needed['unit'] ?? '' }}</small>
                            @if (!$item->next_purchase)
                                <button wire:click="toggleNextPurchase('{{ $item->id }}')" title="Agregar a compras" aria-label="Agregar {{ $item->name }} a compras">
                                    <i class="bi bi-plus-circle"></i>
                                </button>
                            @endif
                        </span>
                    @endif
                @endforeach
            </div>
        </details>
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
        <p class="shopping-list-count">
            {{ $totalItems }} {{ $totalItems === 1 ? 'artículo' : 'artículos' }} por comprar
        </p>

        <div class="shopping-list shopping-list--{{ $viewMode }}">
            @if ($viewMode === 'compact')
                @foreach ($items as $item)
                    @include('livewire.meal._shopping-item', ['rowKey' => $item->id])
                @endforeach
            @else
                @foreach ($grouped as $groupName => $groupItems)
                    <section class="shopping-group" wire:key="shopping-group-{{ md5((string) $groupName) }}">
                        <header class="shopping-group__header">
                            <span>
                                <i class="bi bi-{{ $groupBy === 'category' ? 'tag' : 'geo-alt' }}"></i>
                                @if ($groupBy === 'category')
                                    {{ $this->categoryOptions[$groupName] ?? $groupName ?: 'Sin categoría' }}
                                @else
                                    {{ $groupName ?: 'Sin tienda' }}
                                @endif
                            </span>
                            <small>{{ $groupItems->count() }}</small>
                        </header>
                        @foreach ($groupItems as $item)
                            @include('livewire.meal._shopping-item', ['rowKey' => md5($groupBy.'|'.$groupName.'|'.$item->id)])
                        @endforeach
                    </section>
                @endforeach
            @endif
        </div>
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
