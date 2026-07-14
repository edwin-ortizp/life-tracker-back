<x-module-shell module="tasks">
    <section class="row g-3 mb-3" aria-label="Resumen de progreso">
        <div class="col-md-6">
            <div class="md-card-elevated task-level-card h-100">
                <div class="d-flex align-items-center gap-3">
                    <div class="task-level-badge">{{ $level['level'] }}</div>
                    <div class="flex-grow-1">
                        <div class="md-title-medium">Nivel {{ $level['level'] }} <span class="task-xp-total">{{ $level['totalXp'] }} XP total</span></div>
                        <div class="task-level-meter mt-2" role="progressbar" aria-label="Progreso al siguiente nivel" aria-valuenow="{{ $level['progressPercent'] }}" aria-valuemin="0" aria-valuemax="100"><span style="width: {{ $level['progressPercent'] }}%"></span></div>
                        <p class="md-body-small mb-0 mt-2" style="color: var(--md-sys-color-on-surface-variant);">{{ $level['xpToNextLevel'] }} XP para nivel {{ $level['level'] + 1 }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="md-card-filled text-center h-100">
                <i class="bi bi-fire task-progress-icon task-progress-icon--fire"></i>
                <div class="md-headline-medium">{{ $streaks['current'] }}</div>
                <span class="md-label-medium">racha actual</span>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="md-card-filled text-center h-100">
                <i class="bi bi-award task-progress-icon"></i>
                <div class="md-headline-medium">{{ $streaks['best'] }}</div>
                <span class="md-label-medium">mejor racha</span>
            </div>
        </div>
    </section>

    <section class="md-card-elevated mb-3">
        <div class="d-flex justify-content-between align-items-baseline mb-3"><h2 class="md-title-medium mb-0">Últimos 7 días</h2><span class="md-label-medium">XP y tareas completadas</span></div>
        <div class="task-week-chart">
            @foreach ($dailyProgress as $day)
                <div class="task-week-chart__day">
                    <span class="task-week-chart__xp">{{ $day['xp'] }}</span>
                    <div class="task-week-chart__track"><div class="task-week-chart__bar" style="height: {{ $day['xp'] / $maxDailyXp * 100 }}%" title="{{ $day['xp'] }} XP, {{ $day['count'] }} tareas"></div></div>
                    <strong>{{ $day['count'] }}</strong>
                    <span>{{ $day['date']->locale('es')->translatedFormat('D') }}</span>
                </div>
            @endforeach
        </div>
    </section>

    <section class="row g-3 mb-3" aria-label="Eficacia de planificación">
        <div class="col-md-6"><div class="md-card-filled h-100"><div class="d-flex align-items-center gap-3"><i class="bi bi-calendar-check task-progress-icon"></i><div><div class="md-headline-small">{{ $onTimeRate }}%</div><div class="md-title-small">Completadas el día programado</div><p class="md-body-small mb-0">{{ $onTimeCompleted }} de {{ $scheduledCompletedCount }} tareas con fecha.</p></div></div></div></div>
        <div class="col-md-6"><div class="md-card-filled h-100"><div class="d-flex align-items-center gap-3"><i class="bi bi-exclamation-circle task-progress-icon task-progress-icon--warning"></i><div><div class="md-headline-small">{{ $overdueCount }}</div><div class="md-title-small">Tareas atrasadas pendientes</div><p class="md-body-small mb-0">Prioriza estas antes de añadir nueva carga.</p></div></div></div></div>
    </section>

    @php($priorityLabels = ['urgent-important' => 'Urgente e importante', 'not-urgent-important' => 'No urgente e importante', 'urgent-not-important' => 'Urgente no importante', 'not-urgent-not-important' => 'No urgente no importante', 'Sin definir' => 'Sin prioridad'])
    <section class="row g-3" aria-label="Distribución de avance">
        @foreach (['Por categoría' => $categoryDistribution, 'Por prioridad' => $priorityDistribution, 'Por tamaño' => $sizeDistribution] as $title => $items)
            <div class="col-md-4"><div class="md-card-elevated h-100"><h2 class="md-title-medium mb-3">{{ $title }}</h2>
                @forelse ($items as $item)
                    <div class="task-distribution-row"><span>{{ $title === 'Por prioridad' ? ($priorityLabels[$item['label']] ?? $item['label']) : ucfirst($item['label']) }}</span><span><strong>{{ $item['xp'] }} XP</strong> · {{ $item['count'] }}</span></div>
                @empty
                    <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">Completa tareas para ver este desglose.</p>
                @endforelse
            </div></div>
        @endforeach
    </section>
</x-module-shell>
