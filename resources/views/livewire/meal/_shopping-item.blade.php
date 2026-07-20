<div x-data="{ detailsOpen: false }"
     wire:key="shopping-item-{{ $rowKey ?? $item->id }}"
     class="shopping-row">
    <div class="shopping-row__main">
        <button wire:click="toggleNextPurchase('{{ $item->id }}')"
                class="shopping-row__check"
                title="Marcar como comprado"
                aria-label="Marcar {{ $item->name }} como comprado">
            <i class="bi bi-check-lg"></i>
        </button>

        <div class="shopping-row__content">
            <span class="shopping-row__name">{{ $item->name }}</span>
            @if ($item->unit)
                <span class="shopping-row__unit">{{ $item->unit }}</span>
            @endif
        </div>

        <div class="shopping-row__trailing">
            @if ($item->to_buy > 0)
                <span class="shopping-row__quantity">×{{ $item->to_buy }}</span>
            @endif

            @if ($neededItemIds->contains($item->id))
                <span class="shopping-row__recipe" title="Necesario por una receta" aria-label="Necesario por una receta">
                    <i class="bi bi-calendar-week"></i>
                </span>
            @endif

            @if ($item->variants->isNotEmpty())
                <button type="button"
                        @click="detailsOpen = !detailsOpen"
                        class="shopping-row__details-toggle"
                        :class="{ 'is-open': detailsOpen }"
                        :aria-expanded="detailsOpen"
                        title="Ver tiendas y precios">
                    <i class="bi bi-shop"></i>
                    <span>{{ $item->variants->count() }}</span>
                    <i class="bi bi-chevron-down"></i>
                </button>
            @endif
        </div>
    </div>

    @if ($item->variants->isNotEmpty())
        <div x-show="detailsOpen" x-transition.opacity.duration.150ms x-cloak class="shopping-row__details">
            @foreach ($item->variants as $variant)
                <span class="shopping-variant">
                    @if ($variant->place)<strong>{{ $variant->place }}</strong>@endif
                    @if ($variant->presentation)<span>{{ $variant->presentation }}</span>@endif
                    @if ($variant->price)<span>${{ number_format($variant->price, 2) }}</span>@endif
                </span>
            @endforeach
        </div>
    @endif
</div>
