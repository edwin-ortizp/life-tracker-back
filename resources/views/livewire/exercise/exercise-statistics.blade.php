<x-module-shell module="exercise" archetype="dashboard">
    <x-slot:controls>
        <x-ui.filter-bar label="Periodo de análisis">
            <x-slot:chips>
                @foreach ($periods as $value => $label)
                    <x-ui.chip variant="filter" :selected="$days === $value" wire:click="$set('days', {{ $value }})">{{ $label }}</x-ui.chip>
                @endforeach
            </x-slot:chips>
        </x-ui.filter-bar>
    </x-slot:controls>

    <x-ui.section title="Resumen del periodo" :level="2"
                  description="{{ $start->translatedFormat('d M') }} – {{ $end->translatedFormat('d M Y') }}">
        <x-ui.metric-grid label="Resumen del periodo">
            <x-ui.metric label="Sesiones" icon="bi-activity" tone="primary" :value="$sessions"
                         support="{{ number_format($sessionsPerWeek, 1, ',', '.') }} por semana" />
            <x-ui.metric label="Días activos" icon="bi-calendar-check" tone="success" :value="$activeDays.' de '.$days"
                         support="Racha actual: {{ $streak }} {{ $streak === 1 ? 'día' : 'días' }}" />
            <x-ui.metric label="Tiempo activo" icon="bi-clock" tone="info" :value="number_format($totalMinutes, 0, ',', '.')" unit="min" />
            <x-ui.metric label="Calorías" icon="bi-fire" tone="danger" :value="number_format($totalCalories, 0, ',', '.')" unit="kcal" />
        </x-ui.metric-grid>
    </x-ui.section>

    @if ($hasLogs)
        <x-ui.section title="Minutos activos" :level="3"
                      description="{{ $days > 30 ? 'Total por semana.' : 'Total por día.' }}">
            <x-ui.card variant="elevated">
                <div class="stat-series stat-series--exercise">
                    @foreach ($series as $point)
                        <div class="stat-series__column">
                            <div class="stat-series__bar" style="--md-bar-size: {{ round(($point['value'] / $maxMinutes) * 80) }}px;"
                                 role="img" aria-label="{{ $point['title'] }}: {{ $point['value'] }} min"></div>
                            <span class="stat-series__label md-label-small">{{ $point['label'] }}</span>
                        </div>
                    @endforeach
                </div>
            </x-ui.card>
        </x-ui.section>

        <x-ui.section title="Por tipo de ejercicio" :level="3" description="Frecuencia y tiempo dedicado a cada actividad.">
            <x-ui.list label="Actividad por tipo">
                @foreach ($byType as $row)
                    <x-ui.list-item :headline="$row['name']"
                                    :supporting="$row['sessions'].' '.($row['sessions'] === 1 ? 'sesión' : 'sesiones').' · '.$row['minutes'].' min · '.number_format($row['calories'], 0, ',', '.').' kcal'"
                                    wire:key="exercise-type-stat-{{ $loop->index }}">
                        <x-slot:leading>
                            <span class="md-list-icon-circle" aria-hidden="true">{{ $row['icon'] }}</span>
                        </x-slot:leading>
                        <x-ui.progress :value="$row['minutes']" :max="max($totalMinutes, 1)"
                                       label="Participación en el tiempo activo"
                                       :valueText="($totalMinutes ? round($row['minutes'] / $totalMinutes * 100) : 0).' %'" />
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
        </x-ui.section>

        @if ($records->isNotEmpty())
            <x-ui.section title="Mejores marcas del periodo" :level="3" description="El registro más exigente de cada tipo.">
                <x-ui.list label="Mejores marcas">
                    @foreach ($records as $record)
                        <x-ui.list-item :headline="$record['name']"
                                        :supporting="$record['detail'].' · '.$record['date']->translatedFormat('d M')"
                                        wire:key="exercise-record-{{ $loop->index }}">
                            <x-slot:leading>
                                <span class="md-list-icon-circle" aria-hidden="true">{{ $record['icon'] }}</span>
                            </x-slot:leading>
                        </x-ui.list-item>
                    @endforeach
                </x-ui.list>
            </x-ui.section>
        @endif
    @else
        <x-ui.state variant="empty" icon="bi-bar-chart-line" title="Sin actividad en este periodo"
                    message="Cuando registres ejercicios verás aquí tu evolución, frecuencia y mejores marcas.">
            <x-slot:actions>
                <x-ui.action variant="filled" icon="bi-plus-lg" href="{{ route('exercise') }}">Ir al registro diario</x-ui.action>
            </x-slot:actions>
        </x-ui.state>
    @endif
</x-module-shell>
