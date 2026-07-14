<x-module-shell module="home">
    <x-slot:actions>
        <x-date-navigator :date="$selectedDate" format="l d M Y" />
    </x-slot:actions>

    <div class="md-module-workspace home-workspace">
        <div class="md-module-primary">

    @if ($vehicleAlerts->isNotEmpty())
        <a href="{{ route('vehicles') }}" class="md-card-outlined d-block text-decoration-none mb-3" style="color: inherit; border-color: var(--md-custom-color-warning);">
            <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div class="d-flex gap-3"><div class="md-card-icon" style="background: var(--md-custom-color-warning-container); color: var(--md-custom-color-on-warning-container);"><i class="bi bi-wrench-adjustable"></i></div><div><h2 class="md-title-medium mb-1">Atención para tus vehículos</h2><p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">{{ $vehicleAlerts->count() }} mantenimiento{{ $vehicleAlerts->count() > 1 ? 's' : '' }} próximo{{ $vehicleAlerts->count() > 1 ? 's' : '' }} o vencido{{ $vehicleAlerts->count() > 1 ? 's' : '' }}.</p></div></div>
                <div class="d-flex flex-column gap-1">@foreach ($vehicleAlerts as $alert)<span class="md-label-small"><strong>{{ $alert->vehicle->name }}:</strong> {{ $alert->template->name }}</span>@endforeach</div>
            </div>
        </a>
    @endif

    {{-- Widget Grid --}}
    <div class="row g-3">
        {{-- Water Widget --}}
        <div class="col-md-4 col-6">
            <a href="{{ route('water.daily', ['date' => $selectedDate]) }}" class="md-card-elevated d-block text-decoration-none" style="color: inherit;">
                <div class="text-center">
                    <div class="md-card-icon md-card-icon--primary mx-auto mb-2">
                        <i class="bi bi-droplet"></i>
                    </div>
                    <h3 class="md-title-small mb-1" style="color: var(--md-sys-color-on-surface);">Hidratación</h3>
                    <div class="md-headline-small" style="color: var(--md-sys-color-primary);">{{ number_format($waterTotal) }} ml</div>
                    <div class="md-progress-linear mt-3 mb-2">
                        <div class="md-progress-linear-bar" style="width: {{ min(($waterTotal / $waterGoal) * 100, 100) }}%"></div>
                    </div>
                    <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">Meta: {{ number_format($waterGoal) }} ml</span>
                </div>
            </a>
        </div>

        {{-- Mood Widget --}}
        <div class="col-md-4 col-6">
            <a href="{{ route('mood', ['date' => $selectedDate]) }}" class="md-card-elevated d-block text-decoration-none" style="color: inherit;">
                <div class="text-center">
                    <div style="font-size: 2.5rem; margin-bottom: 8px;">{{ $lastMood?->emoji ?? '😶' }}</div>
                    <h3 class="md-title-small mb-1" style="color: var(--md-sys-color-on-surface);">Estado</h3>
                    <div class="md-body-large" style="color: var(--md-sys-color-on-surface);">{{ $lastMood?->text ?? 'Sin registro' }}</div>
                    @if ($lastMood)
                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $lastMood->time }}</span>
                    @endif
                </div>
            </a>
        </div>

        {{-- Energy Widget --}}
        <div class="col-md-4 col-6">
            <a href="{{ route('mood', ['date' => $selectedDate]) }}" class="md-card-elevated d-block text-decoration-none" style="color: inherit;">
                <div class="text-center">
                    <div class="md-card-icon mx-auto mb-2" style="background: var(--md-custom-color-warning-container); color: var(--md-custom-color-on-warning-container);">
                        <i class="bi bi-lightning-charge"></i>
                    </div>
                    <h3 class="md-title-small mb-1" style="color: var(--md-sys-color-on-surface);">Energía</h3>
                    <div class="md-headline-small" style="color: var(--md-custom-color-warning);">{{ $lastEnergy?->level ?? '-' }}/5</div>
                    @if ($lastEnergy?->comment)
                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ Str::limit($lastEnergy->comment, 20) }}</span>
                    @endif
                </div>
            </a>
        </div>

        {{-- Habits Widget --}}
        <div class="col-md-4 col-6">
            <a href="{{ route('habits', ['date' => $selectedDate]) }}" class="md-card-elevated d-block text-decoration-none" style="color: inherit;">
                <div class="text-center">
                    <div class="md-card-icon mx-auto mb-2" style="background: var(--md-custom-color-success-container); color: var(--md-custom-color-on-success-container);">
                        <i class="bi bi-check2-square"></i>
                    </div>
                    <h3 class="md-title-small mb-1" style="color: var(--md-sys-color-on-surface);">Hábitos</h3>
                    <div class="md-headline-small" style="color: var(--md-custom-color-success);">{{ $completedHabits }}/{{ $totalHabits }}</div>
                    <div class="md-progress-linear md-progress-linear--success mt-3">
                        <div class="md-progress-linear-bar" style="width: {{ $totalHabits > 0 ? ($completedHabits / $totalHabits * 100) : 0 }}%"></div>
                    </div>
                </div>
            </a>
        </div>

        {{-- Tasks Widget --}}
        <div class="col-md-4 col-6">
            <a href="{{ route('tasks.list') }}" class="md-card-elevated d-block text-decoration-none" style="color: inherit;">
                <div class="text-center">
                    <div class="md-card-icon mx-auto mb-2" style="background: var(--md-custom-color-info-container); color: var(--md-custom-color-on-info-container);">
                        <i class="bi bi-list-task"></i>
                    </div>
                    <h3 class="md-title-small mb-1" style="color: var(--md-sys-color-on-surface);">Tareas</h3>
                    <div class="md-headline-small" style="color: var(--md-custom-color-info);">{{ $pendingTasks }}</div>
                    <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">pendientes · {{ $completedTasks }} hoy</span>
                </div>
            </a>
        </div>

        {{-- Quick Actions Widget --}}
        <div class="col-md-4 col-6">
            <div class="md-card-outlined" style="height: 100%;">
                <div class="text-center">
                    <div class="md-card-icon md-card-icon--secondary mx-auto mb-2">
                        <i class="bi bi-plus-circle"></i>
                    </div>
                    <h3 class="md-title-small mb-2" style="color: var(--md-sys-color-on-surface);">Acciones Rápidas</h3>
                    <div class="d-flex flex-wrap gap-2 justify-content-center mt-2">
                        <a href="{{ route('water.daily', ['date' => $selectedDate]) }}" class="md-btn-tonal" style="height: 32px; padding: 0 14px; font-size: 0.8125rem;">
                            <i class="bi bi-droplet"></i> Agua
                        </a>
                        <a href="{{ route('mood', ['date' => $selectedDate]) }}" class="md-btn-tonal" style="height: 32px; padding: 0 14px; font-size: 0.8125rem;">
                            <i class="bi bi-emoji-smile"></i> Estado
                        </a>
                        <a href="{{ route('habits', ['date' => $selectedDate]) }}" class="md-btn-tonal" style="height: 32px; padding: 0 14px; font-size: 0.8125rem;">
                            <i class="bi bi-check2-square"></i> Hábitos
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
        </div>

        <aside class="md-context-rail">
            <x-context-widget title="Bitácora del día" icon="bi-journal-text">
                @if ($journalEntry)
                    <p class="home-journal-excerpt">{{ Str::limit($journalEntry->text, 180) }}</p>
                    <a href="{{ route('journal', ['date' => $selectedDate]) }}" class="md-btn-text w-100">Continuar escribiendo</a>
                @else
                    <p>Todavía no has escrito una entrada para este día.</p>
                    <a href="{{ route('journal', ['date' => $selectedDate]) }}" class="md-btn-tonal w-100"><i class="bi bi-pencil"></i> Escribir entrada</a>
                @endif
            </x-context-widget>

            <x-context-widget title="Pulso del día" icon="bi-stars" tone="success">
                <dl class="md-context-list">
                    <div><dt>Hidratación</dt><dd>{{ $waterGoal > 0 ? round(($waterTotal / $waterGoal) * 100) : 0 }}%</dd></div>
                    <div><dt>Hábitos</dt><dd>{{ $completedHabits }}/{{ $totalHabits }}</dd></div>
                    <div><dt>Ánimo</dt><dd>{{ $lastMood?->emoji ?? '—' }}</dd></div>
                    <div><dt>Energía</dt><dd>{{ $lastEnergy?->level ?? '—' }}/5</dd></div>
                </dl>
            </x-context-widget>

            <x-context-widget title="Atajos relacionados" icon="bi-lightning-charge">
                <div class="d-grid gap-2"><a href="{{ route('journal', ['date' => $selectedDate]) }}" class="md-btn-outlined"><i class="bi bi-journal-text"></i> Diario</a><a href="{{ route('tasks.planning', ['date' => $selectedDate]) }}" class="md-btn-outlined"><i class="bi bi-calendar-check"></i> Planificar tareas</a></div>
            </x-context-widget>
        </aside>
    </div>
</x-module-shell>
