{{-- Calendario del mes: cada día es un recipiente que se llena desde abajo según el cumplimiento de la meta. --}}
@php
    $formatLiters = fn (int $ml) => number_format($ml / 1000, 1, ',', '.').' L';
@endphp

<div class="water-fill-calendar" role="grid" aria-label="Cumplimiento de la meta de hidratación en {{ $monthData['label'] }}">
    <div class="water-fill-calendar__weekdays" role="row">
        @foreach (['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as $weekday)<span role="columnheader">{{ $weekday }}</span>@endforeach
    </div>
    @foreach ($monthData['weeks'] as $week)
        <div class="water-fill-calendar__week" role="row">
            @foreach ($week as $day)
                @php
                    $isEmpty = ! $day['has_data'] || $day['future'];
                    $dateLabel = $day['date']->translatedFormat('j \d\e F');
                    $dayLabel = $isEmpty
                        ? $dateLabel.': sin registros'
                        : $dateLabel.': '.$formatLiters($day['total']).' de '.$formatLiters($dailyGoal).' ('.$day['raw_percentage'].' %)';
                @endphp
                <a href="{{ route('water.daily', ['date' => $day['date']->toDateString()]) }}" wire:navigate
                   @class([
                       'water-fill-day',
                       'is-outside' => ! $day['in_month'],
                       'is-today' => $day['today'],
                       'is-selected' => $day['selected'],
                       'is-empty' => $isEmpty,
                       'is-high' => ! $isEmpty && $day['raw_percentage'] >= 60,
                   ])
                   style="--md-progress-value: {{ $isEmpty ? 0 : min($day['raw_percentage'], 100) }}%"
                   role="gridcell" title="{{ $dayLabel }}" aria-label="{{ $day['today'] ? 'Hoy, ' : '' }}{{ $dayLabel }}">
                    <span>{{ $day['date']->day }}</span>
                </a>
            @endforeach
        </div>
    @endforeach
</div>
