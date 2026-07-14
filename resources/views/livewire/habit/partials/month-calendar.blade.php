<div class="habit-month-calendar" aria-label="Cumplimiento mensual de hábitos">
    <div class="habit-month-calendar__weekdays" aria-hidden="true">
        @foreach (['L', 'M', 'X', 'J', 'V', 'S', 'D'] as $weekday)<span>{{ $weekday }}</span>@endforeach
    </div>
    @foreach ($monthData['weeks'] as $week)
        <div class="habit-month-calendar__week">
            @foreach ($week as $day)
                <a href="{{ route('habits', ['date' => $day['date']->toDateString()]) }}"
                   class="habit-month-day {{ $day['in_month'] ? '' : 'is-outside' }} {{ $day['selected'] ? 'is-selected' : '' }} {{ $day['percentage'] === 100 ? 'is-complete' : '' }}"
                   style="--habit-progress: {{ $day['percentage'] }}%"
                   aria-label="{{ $day['date']->translatedFormat('j \d\e F') }}: {{ $day['percentage'] }}% de hábitos cumplidos"
                   title="{{ $day['completed'] }}/{{ $monthData['habit_count'] }} hábitos">
                    <span>{{ $day['date']->day }}</span>
                    @if ($day['today'])<i aria-hidden="true"></i>@endif
                </a>
            @endforeach
        </div>
    @endforeach
</div>
