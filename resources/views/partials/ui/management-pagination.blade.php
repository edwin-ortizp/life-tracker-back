{{-- Paginación de la Card de gestión: anterior/siguiente, páginas numeradas y versión compacta «1 / 3». --}}
@php($pageName = $paginator->getPageName())
<nav class="md-pager" aria-label="Paginación">
    <button type="button" class="md-pager__step" wire:click="previousPage('{{ $pageName }}')" wire:loading.attr="disabled"
            @disabled($paginator->onFirstPage()) aria-label="Página anterior" title="Página anterior">
        <i class="bi bi-chevron-left" aria-hidden="true"></i><span>Anterior</span>
    </button>
    @foreach ($elements as $element)
        @if (is_string($element))
            <span class="md-pager__gap" aria-hidden="true">…</span>
        @elseif (is_array($element))
            @foreach ($element as $page => $url)
                @if ($page == $paginator->currentPage())
                    <button type="button" class="md-pager__page is-active" aria-current="page" aria-label="Página {{ $page }}">{{ $page }}</button>
                @else
                    <button type="button" class="md-pager__page" wire:key="pager-{{ $pageName }}-{{ $page }}" wire:click="gotoPage({{ $page }}, '{{ $pageName }}')" aria-label="Página {{ $page }}">{{ $page }}</button>
                @endif
            @endforeach
        @endif
    @endforeach
    <span class="md-pager__compact">{{ $paginator->currentPage() }} / {{ max(1, $paginator->lastPage()) }}</span>
    <button type="button" class="md-pager__step" wire:click="nextPage('{{ $pageName }}')" wire:loading.attr="disabled"
            @disabled(! $paginator->hasMorePages()) aria-label="Página siguiente" title="Página siguiente">
        <span>Siguiente</span><i class="bi bi-chevron-right" aria-hidden="true"></i>
    </button>
</nav>
