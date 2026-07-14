<x-module-shell module="water">
    <x-slot:actions>
        <div class="md-date-navigator">
            <button wire:click="previousWeek" class="md-btn-icon" aria-label="Semana anterior"><i class="bi bi-chevron-left"></i></button>
            <button wire:click="today" class="md-date-navigator__today">Esta semana</button>
            <span class="md-date-navigator__label">{{ $weekData['start']->format('d M') }} – {{ $weekData['end']->format('d M') }}</span>
            <button wire:click="nextWeek" class="md-btn-icon" aria-label="Semana siguiente"><i class="bi bi-chevron-right"></i></button>
        </div>
    </x-slot:actions>
    <div class="row g-3 mb-3">
        <div class="col-md-4"><div class="md-card-filled h-100"><span class="md-label-small">PROMEDIO</span><div class="md-headline-small mt-2">{{ number_format($weekData['average']) }} ml</div></div></div>
        <div class="col-md-4"><div class="md-card-filled h-100"><span class="md-label-small">META ALCANZADA</span><div class="md-headline-small mt-2">{{ $weekData['completed_days'] }}/7 días</div></div></div>
        <div class="col-md-4"><div class="md-card-filled h-100"><span class="md-label-small">TOTAL</span><div class="md-headline-small mt-2">{{ number_format($weekData['total']) }} ml</div></div></div>
    </div>
    <section class="md-card-elevated water-week-bars">
        @foreach ($weekData['days'] as $day)
            <a href="{{ route('water.daily', ['date' => $day['date']->toDateString()]) }}" class="water-week-row">
                <span>{{ $day['date']->translatedFormat('D d') }}</span><div><i style="width: {{ $day['percentage'] }}%"></i></div><strong>{{ number_format($day['total']) }} ml</strong>
            </a>
        @endforeach
    </section>
</x-module-shell>
