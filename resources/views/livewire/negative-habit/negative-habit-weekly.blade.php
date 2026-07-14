<x-module-shell module="negative-habits" x-data="{ showLogDialog: $wire.entangle('showLogForm') }">
    <x-slot:actions>
        <div class="md-date-navigator"><button wire:click="previousWeek" class="md-btn-icon" aria-label="Semana anterior"><i class="bi bi-chevron-left"></i></button><button wire:click="thisWeek" class="md-date-navigator__today">Esta semana</button><span class="md-date-navigator__label">{{ $weekStart->format('d M') }} – {{ $weekEnd->format('d M') }}</span><button wire:click="nextWeek" class="md-btn-icon" aria-label="Semana siguiente"><i class="bi bi-chevron-right"></i></button></div>
    </x-slot:actions>

    {{-- Weekly Summary --}}
    <div class="md-card-filled text-center mb-3" style="padding: 20px;">
        <div class="md-headline-medium {{ $weeklyCount > 0 ? '' : '' }}" style="color: {{ $weeklyCount > 0 ? 'var(--md-sys-color-error)' : 'var(--md-custom-color-success)' }};">{{ $weeklyCount }}</div>
        <span class="md-label-medium" style="color: var(--md-sys-color-on-surface-variant);">incidencias esta semana</span>
    </div>

    {{-- Habits grouped by category --}}
    @php $grouped = $habits->groupBy('category'); @endphp

    @foreach ($grouped as $category => $categoryHabits)
        <div class="md-card-elevated mb-3" style="padding: 0; overflow: hidden;">
            <div style="padding: 16px 16px 8px 16px;">
                <span class="md-title-small text-capitalize" style="color: var(--md-sys-color-on-surface);">{{ $category }}</span>
            </div>
            @foreach ($categoryHabits as $habit)
                @php
                    $habitLogs = $logs->get($habit->id, collect());
                    $count = $habitLogs->count();
                @endphp
                <div class="md-list-item">
                    <div class="d-flex align-items-center gap-2 flex-grow-1">
                        <span style="font-size: 1.2rem;">{{ $habit->icon }}</span>
                        <div class="md-list-item-content">
                            <div class="md-list-item-headline">{{ $habit->name }}</div>
                        </div>
                        @if ($count > 0)
                            <span class="md-badge" style="min-width: 20px; height: 20px;">{{ $count }}</span>
                        @endif
                    </div>
                    <div class="md-list-item-trailing">
                        <button wire:click="openLogForm({{ $habit->id }})" class="md-btn-icon" style="color: var(--md-sys-color-error);">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                </div>
            @endforeach
        </div>
    @endforeach

    {{-- Log Dialog --}}
    <template x-if="showLogDialog">
        <div>
            <div class="md-dialog-scrim" @click="showLogDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">Registrar Incidencia</h2>
                <div class="md-dialog-content">
                    <div class="md-text-field">
                        <input type="text" wire:model="note" placeholder=" " id="neg-note">
                        <label for="neg-note">Nota (opcional)</label>
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showLogDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="saveLog" class="md-btn-filled" style="background: var(--md-sys-color-error); color: var(--md-sys-color-on-error);">
                        <i class="bi bi-plus-lg"></i> Registrar
                    </button>
                </div>
            </div>
        </div>
    </template>
</x-module-shell>
