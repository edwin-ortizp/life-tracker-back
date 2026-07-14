<div
    x-data="{
        active: false,
        xp: 0,
        message: '',
        timeout: null,
        celebrate(detail) {
            this.xp = detail.xp;
            this.message = detail.levelUp
                ? `¡Nivel ${detail.level}! Sigue así.`
                : (detail.streakMilestone ? `¡Racha de ${detail.streak} días!` : `+${detail.xp} XP por avanzar.`);
            this.active = true;
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.active = false, 2800);
        }
    }"
    x-on:task-completed.window="celebrate($event.detail)"
    class="task-celebration"
    :class="{ 'is-active': active }"
    aria-live="polite"
    aria-atomic="true"
>
    <div class="task-celebration__confetti" aria-hidden="true">
        @for ($piece = 0; $piece < 18; $piece++)
            <i style="--piece: {{ $piece }}"></i>
        @endfor
    </div>
    <div class="task-celebration__content">
        <i class="bi bi-check2-circle"></i>
        <div><strong x-text="`+${xp} XP`"></strong><span x-text="message"></span></div>
    </div>
</div>
