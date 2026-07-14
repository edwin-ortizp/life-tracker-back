<div
    x-data="{
        active: false,
        detail: null,
        timeout: null,
        showFeedback(event) {
            this.detail = event.detail;
            this.active = true;
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.active = false, this.detail.kind === 'day' ? 3600 : 2800);
        }
    }"
    x-on:habit-feedback.window="showFeedback($event)"
    class="habit-feedback"
    :class="{
        'is-active': active,
        'is-celebration': detail && detail.kind === 'day',
        'is-support': detail && detail.tone === 'support',
        'is-neutral': detail && detail.tone === 'neutral'
    }"
    role="status"
    aria-live="polite"
    aria-atomic="true"
>
    <div class="habit-feedback__confetti" x-show="detail && detail.kind === 'day'" aria-hidden="true">
        @for ($piece = 0; $piece < 20; $piece++)
            <i style="--piece: {{ $piece }}"></i>
        @endfor
    </div>
    <div class="habit-feedback__surface">
        <div class="habit-feedback__icon" aria-hidden="true"><i class="bi" :class="detail ? detail.icon : 'bi-check2-circle'"></i></div>
        <div class="habit-feedback__copy">
            <strong x-text="detail ? detail.title : ''"></strong>
            <span x-text="detail ? detail.message : ''"></span>
        </div>
    </div>
</div>
