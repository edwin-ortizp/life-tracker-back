<section class="plan-card" aria-labelledby="{{ $id }}">
    <header class="plan-card__head">
        <i class="bi bi-link-45deg" aria-hidden="true"></i>
        <h2 id="{{ $id }}">Enlaces compartidos</h2>
    </header>
    <div class="plan-card__body">
        @forelse ($links as $link)
            @php $platform = $link->platform(); @endphp
            <a class="plan-mini" href="{{ $link->url }}" target="_blank" rel="noopener noreferrer">
                <span class="plan-mini__icon"><i class="bi {{ $platform['icon'] }}" aria-hidden="true"></i></span>
                <span class="plan-mini__body">
                    <strong>{{ $link->label ?: $link->plan->title }}</strong>
                    <span>{{ $platform['label'] }} · {{ $link->created_at->translatedFormat('j M Y') }}</span>
                </span>
                <i class="bi bi-box-arrow-up-right plan-mini__trail" aria-hidden="true"></i>
            </a>
        @empty
            <p class="plans-muted">Aún no hay enlaces guardados.</p>
        @endforelse
        <div>
            <x-ui.action variant="outlined" icon="bi-link-45deg" wire:click="openPlanForm">Compartir enlace</x-ui.action>
        </div>
    </div>
</section>
