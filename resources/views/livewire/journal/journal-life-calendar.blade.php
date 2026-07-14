<x-module-shell module="journal" class="life-calendar">
    @if ($isConfigured)
        <x-slot:actions><a href="#life-year-{{ $currentYear }}" class="md-btn-tonal"><i class="bi bi-crosshair"></i> Ir a hoy</a></x-slot:actions>
    @endif

    @if (! $isConfigured)
        <section class="md-card-outlined life-calendar-empty text-center">
            <div class="life-calendar-empty__icon"><i class="bi bi-hourglass-split"></i></div>
            <h2 class="md-title-large">Tu calendario todavía no tiene límites</h2>
            <p class="md-body-medium">Agrega tu fecha de nacimiento y una expectativa de vida personal para dibujar las semanas de tu vida.</p>
            <a href="{{ route('settings') }}" class="md-btn-filled"><i class="bi bi-gear"></i> Configurar perfil</a>
        </section>
    @else
        <section class="life-calendar-summary mb-3" aria-label="Resumen de semanas">
            <div><span>Por vivir</span><strong>{{ number_format($remainingWeeks) }}</strong><small>semanas</small></div>
            <div><span>Vividas</span><strong>{{ number_format($livedWeeks) }}</strong><small>semanas</small></div>
            <div><span>Total</span><strong>{{ number_format($totalWeeks) }}</strong><small>semanas</small></div>
        </section>

        <section class="md-card-outlined life-calendar-card" aria-label="Calendario completo de vida">
            <div class="life-calendar-card__heading">
                <div>
                    <span class="life-calendar-eyebrow"><i class="bi bi-map"></i> MAPA COMPLETO</span>
                    <h2 class="md-title-medium mb-0">Tus semanas, de principio a fin</h2>
                </div>
                <div class="life-calendar-legend" aria-label="Leyenda">
                    <span><i class="life-calendar-cell level-0"></i> Sin entradas</span>
                    <span><i class="life-calendar-cell level-1"></i> 1–3</span>
                    <span><i class="life-calendar-cell level-2"></i> 4–6</span>
                    <span><i class="life-calendar-cell level-3"></i> 7</span>
                    <span><i class="life-calendar-cell is-future"></i> Por vivir</span>
                </div>
            </div>

            <div class="life-calendar-map" role="grid" aria-label="Semanas desde el nacimiento hasta la expectativa de vida">
                <div class="life-calendar-map__inner">
                    @foreach ($weekRows as $year => $weeks)
                        <div id="life-year-{{ $year }}" class="life-calendar-row {{ $year === $currentYear ? 'is-current-year' : '' }}" role="row">
                            <span class="life-calendar-year" role="rowheader">{{ $year }}</span>
                            <div class="life-calendar-cells">
                                @foreach ($weeks as $cell)
                                    @php
                                        $level = $cell['entries_count'] === 0 ? 0 : ($cell['entries_count'] <= 3 ? 1 : ($cell['entries_count'] <= 6 ? 2 : 3));
                                        $label = sprintf('Semana %s, del %s al %s, %d día%s con entrada%s', $cell['key'], $cell['start']->translatedFormat('d M'), $cell['end']->translatedFormat('d M'), $cell['entries_count'], $cell['entries_count'] === 1 ? '' : 's', $cell['is_future'] ? '. Aún no disponible.' : '');
                                    @endphp
                                    @if ($cell['is_future'])
                                        <span class="life-calendar-cell level-{{ $level }} is-future" role="gridcell" aria-label="{{ $label }}" title="{{ $label }}"></span>
                                    @else
                                        <a href="{{ route('journal.life.week', ['week' => $cell['key']]) }}" class="life-calendar-cell level-{{ $level }} {{ $cell['is_current'] ? 'is-current' : '' }}" role="gridcell" aria-label="{{ $label }}" title="{{ $label }}"></a>
                                    @endif
                                @endforeach
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            <p class="life-calendar-caption mb-0"><i class="bi bi-cursor"></i> Selecciona una semana disponible para abrir su vista detallada.</p>
        </section>
    @endif
</x-module-shell>
