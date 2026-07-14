<div class="focus-month-calendar" role="grid" aria-label="Progreso mensual de enfoque">
    <div class="focus-month-calendar__weekdays" role="row">@foreach (['L','M','X','J','V','S','D'] as $day)<span role="columnheader">{{ $day }}</span>@endforeach</div>
    @foreach ($monthData['weeks'] as $week)
        <div class="focus-month-calendar__week" role="row">
            @foreach ($week as $day)
                <button wire:click="$set('selectedDate', '{{ $day['date']->toDateString() }}')" class="focus-month-day {{ ! $day['in_month'] ? 'is-outside' : '' }} {{ $day['completed'] ? 'is-complete' : '' }} {{ $day['selected'] ? 'is-selected' : '' }}" style="--focus-progress: {{ $day['percentage'] }}%" title="{{ $day['date']->translatedFormat('d M') }} · {{ $day['minutes'] }} min" role="gridcell">
                    <span>{{ $day['date']->day }}</span>
                </button>
            @endforeach
        </div>
    @endforeach
</div>
