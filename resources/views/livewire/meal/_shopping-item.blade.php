@php
    $offers = $item->offers($placeFilter ?: null)->sortBy(fn ($offer) => $offer['per_base'] ?? PHP_FLOAT_MAX);
    $subtotal = $item->estimatedSubtotal($placeFilter ?: null);
@endphp
<div x-data="{ detailsOpen: false }"
     wire:key="shopping-item-{{ $rowKey ?? $item->id }}"
     class="shopping-row">
    <div class="shopping-row__main">
        <button wire:click="openPurchase('{{ $item->id }}')"
                class="shopping-row__check"
                title="Marcar como comprado"
                aria-label="Marcar {{ $item->name }} como comprado">
            <i class="bi bi-check-lg"></i>
        </button>

        <div class="shopping-row__content">
            <span class="shopping-row__name">{{ $item->name }}</span>
            @if ($item->base_unit)
                <span class="shopping-row__unit">{{ $item->baseUnitLabel() }}</span>
            @endif
        </div>

        <div class="shopping-row__trailing">
            @if ($item->to_buy > 0)
                <span class="shopping-row__quantity">×{{ rtrim(rtrim(number_format($item->to_buy, 3, ',', ''), '0'), ',') }}</span>
            @endif

            @if ($subtotal !== null)
                <span class="shopping-row__price" title="Subtotal estimado">${{ number_format($subtotal, 0, ',', '.') }}</span>
            @else
                <span class="shopping-row__price is-missing" title="Sin precio registrado">sin precio</span>
            @endif

            @if ($neededItemIds->contains($item->id))
                <span class="shopping-row__recipe" title="Necesario por una receta" aria-label="Necesario por una receta">
                    <i class="bi bi-calendar-week"></i>
                </span>
            @endif

            @if ($offers->isNotEmpty())
                <button type="button"
                        @click="detailsOpen = !detailsOpen"
                        class="shopping-row__details-toggle"
                        :class="{ 'is-open': detailsOpen }"
                        :aria-expanded="detailsOpen"
                        title="Ver tiendas y precios">
                    <i class="bi bi-shop"></i>
                    <span>{{ $offers->count() }}</span>
                    <i class="bi bi-chevron-down"></i>
                </button>
            @endif
        </div>
    </div>

    @if ($offers->isNotEmpty())
        <div x-show="detailsOpen" x-transition.opacity.duration.150ms x-cloak class="shopping-row__details">
            @foreach ($offers as $offer)
                <span class="shopping-variant">
                    <strong>{{ $offer['price']->store?->name }}</strong>
                    <span>{{ $offer['variant']->label($item->base_unit) }}</span>
                    <span>${{ number_format($offer['price']->amount, 0, ',', '.') }}</span>
                    @if ($offer['per_base'] !== null)
                        <span>${{ number_format($offer['per_base'], 0, ',', '.') }}/{{ \App\Services\Meal\UnitConverter::comparisonLabel($item->base_unit) }}</span>
                    @endif
                </span>
            @endforeach
            <a href="{{ route('meals.compare', $item) }}" wire:navigate class="md-link md-label-medium">Comparar</a>
        </div>
    @endif
</div>
