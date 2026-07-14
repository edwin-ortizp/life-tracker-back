<div class="water-month-calendar" role="grid" aria-label="Cumplimiento mensual de hidratación">
    <div class="water-month-calendar__weekdays" role="row">
        @foreach (['L', 'M', 'X', 'J', 'V', 'S', 'D'] as $day)<span role="columnheader">{{ $day }}</span>@endforeach
    </div>
    @foreach ($monthData['weeks'] as $week)
        <div class="water-month-calendar__week" role="row">
            @foreach ($week as $day)
                <a href="{{ route('water.daily', ['date' => $day['date']->toDateString()]) }}"
                   class="water-month-day {{ ! $day['in_month'] ? 'is-outside' : '' }} {{ $day['completed'] ? 'is-complete' : '' }} {{ $day['selected'] ? 'is-selected' : '' }}"
                   style="--water-progress: {{ $day['percentage'] }}%"
                   role="gridcell" aria-label="{{ $day['date']->translatedFormat('d \d\e F') }}: {{ number_format($day['total']) }} ml">
                    <span>{{ $day['date']->day }}</span>
                    @if ($day['total'] > 0)<i aria-hidden="true"></i>@endif
                </a>
            @endforeach
        </div>
    @endforeach
</div>
