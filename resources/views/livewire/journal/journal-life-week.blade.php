<x-module-shell module="journal" class="life-calendar">
    @if (! $isAvailable)
        <section class="md-card-outlined life-calendar-empty text-center">
            <div class="life-calendar-empty__icon"><i class="bi bi-calendar-x"></i></div>
            <h2 class="md-title-large">Esta semana no está disponible</h2>
            <p class="md-body-medium">Solo puedes revisar semanas dentro de tu calendario de vida que ya hayan comenzado.</p>
            <a href="{{ route('journal.life') }}" class="md-btn-filled">Ir al calendario</a>
        </section>
    @else
        <section class="life-week-hero mb-3">
            <span class="life-calendar-eyebrow"><i class="bi bi-calendar3"></i> {{ $week }}</span>
            <h2>{{ $weekStart->translatedFormat('d M') }} – {{ $weekEnd->translatedFormat('d M Y') }}</h2>
            <p class="mb-0">{{ $entries->count() }} de 7 días con entrada</p>
        </section>

        <section class="life-week-days" aria-label="Días de la semana">
            @foreach ($days as $day)
                @php $entry = $entries->get($day->toDateString()); @endphp
                <a href="{{ route('journal', ['date' => $day->toDateString()]) }}" class="life-week-day {{ $entry ? 'has-entry' : '' }}">
                    <div class="life-week-day__header">
                        <span>{{ $day->translatedFormat('l') }}</span>
                        <strong>{{ $day->format('d') }}</strong>
                    </div>
                    <p>{{ $entry ? Str::limit($entry->text, 150) : 'Sin entrada todavía.' }}</p>
                    <span class="life-week-day__action">{{ $entry ? 'Abrir entrada' : 'Escribir' }} <i class="bi bi-arrow-right"></i></span>
                </a>
            @endforeach
        </section>
    @endif
</x-module-shell>
