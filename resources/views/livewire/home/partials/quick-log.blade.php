<div class="md-card-elevated h-100">
    <h2 class="md-title-small mb-3" style="color: var(--md-sys-color-on-surface);">
        <i class="bi bi-lightning-charge" style="color: var(--md-custom-color-warning);"></i> Registro rápido
    </h2>

    {{-- Hydration --}}
    <div class="mb-3">
        <div class="home-section-label md-label-medium">
            <i class="bi bi-droplet" style="color: var(--md-sys-color-primary);"></i>
            <span>Hidratación</span>
            <span class="ms-auto md-label-small">{{ number_format($waterTotal) }} / {{ number_format($waterGoal) }} ml</span>
        </div>
        <div class="md-progress-linear mb-2">
            <div class="md-progress-linear-bar" style="width: {{ $waterGoal > 0 ? min(($waterTotal / $waterGoal) * 100, 100) : 0 }}%"></div>
        </div>
        <div class="home-quick-row">
            @foreach ($drinkTypes->take(4) as $type)
                <button type="button" class="home-chip"
                        wire:click="quickAddWater('{{ $type->id }}', 250)"
                        wire:loading.attr="disabled"
                        title="{{ $type->name }} 250 ml">
                    {{ $type->icon ?? '💧' }} {{ $type->name }} +250
                </button>
                @if ($loop->first)
                    <button type="button" class="home-chip"
                            wire:click="quickAddWater('{{ $type->id }}', 500)"
                            wire:loading.attr="disabled"
                            title="{{ $type->name }} 500 ml">
                        {{ $type->icon ?? '💧' }} +500
                    </button>
                @endif
            @endforeach
        </div>
    </div>

    {{-- Mood --}}
    <div class="mb-3">
        <div class="home-section-label md-label-medium">
            <i class="bi bi-emoji-smile" style="color: var(--md-sys-color-tertiary);"></i>
            <span>¿Cómo te sientes?</span>
            @if ($lastMood)
                <span class="ms-auto md-label-small">{{ $lastMood->emoji }} {{ $lastMood->text }} · {{ $lastMood->time }}</span>
            @endif
        </div>
        <div class="home-quick-row">
            @foreach ($moodStates as $state)
                <button type="button"
                        class="home-mood-btn {{ $lastMood?->mood_state_id === $state->id ? 'is-selected' : '' }}"
                        wire:click="saveMood('{{ $state->id }}')"
                        wire:loading.attr="disabled"
                        title="{{ $state->text }}"
                        aria-label="{{ $state->text }}">
                    {{ $state->emoji }}
                </button>
            @endforeach
        </div>
    </div>

    {{-- Energy --}}
    <div>
        <div class="home-section-label md-label-medium">
            <i class="bi bi-battery-charging" style="color: var(--md-custom-color-warning);"></i>
            <span>Energía</span>
            @if ($lastEnergy)
                <span class="ms-auto md-label-small">{{ $lastEnergy->level }}/5 · {{ $lastEnergy->time }}</span>
            @endif
        </div>
        <div class="home-quick-row">
            @foreach (range(1, 5) as $level)
                <button type="button"
                        class="home-chip {{ $lastEnergy?->level === $level ? 'is-selected' : '' }}"
                        wire:click="saveEnergy({{ $level }})"
                        wire:loading.attr="disabled"
                        aria-label="Energía nivel {{ $level }}">
                    <i class="bi bi-lightning-charge-fill" style="color: var(--md-custom-color-warning);"></i> {{ $level }}
                </button>
            @endforeach
        </div>
    </div>
</div>
