<div>
    <div class="md-dialog-scrim" wire:click="close"></div>
    <div class="md-dialog md-reflection" role="dialog" aria-labelledby="reflection-heading">
        <h2 class="md-dialog-headline md-headline-small" id="reflection-heading">
            {{ $entry->emoji }} Reflexión sobre “{{ $entry->text }}”
        </h2>

        <div class="md-dialog-content">
            <div class="md-reflection__scope">
                <button type="button" wire:click="toggleScope" class="md-btn-text"
                        aria-expanded="{{ $showScope ? 'true' : 'false' }}" aria-controls="reflection-scope">
                    <i class="bi bi-info-circle"></i> ¿Para qué sirve esto?
                </button>
                @if ($showScope)
                    <div class="md-reflection__scope-body" id="reflection-scope">
                        <p class="md-body-small mb-2">
                            Es una herramienta de autoobservación: te hace unas preguntas fijas para que
                            escribas con tus propias palabras lo que pasó y lo que pensaste.
                        </p>
                        <p class="md-body-small mb-2">
                            No interpreta ni clasifica tus respuestas, no emite diagnósticos y no propone
                            tratamientos. Nada de lo que escribas se analiza automáticamente.
                        </p>
                        <p class="md-body-small mb-0">
                            <strong>No sustituye la atención de un profesional de salud mental.</strong>
                            Si estás en una situación de emergencia o riesgo, busca ayuda profesional o
                            los servicios de emergencia de tu país.
                        </p>
                    </div>
                @endif
            </div>

            @if ($showSummary)
                <section class="md-reflection__summary" aria-label="Resumen de la reflexión">
                    <p class="md-body-small" style="color: var(--md-sys-color-on-surface-variant);">
                        Esto fue lo que escribiste. Los pasos que omitiste quedan en blanco.
                    </p>

                    @forelse ($answers as $answered)
                        <div class="md-reflection__answer">
                            <dt class="md-label-medium">{{ $answered['label'] }}</dt>
                            <dd class="md-body-medium">{{ $answered['answer'] }}</dd>
                        </div>
                    @empty
                        <p class="md-body-medium mb-0">No registraste respuestas en esta reflexión.</p>
                    @endforelse

                    @if ($entry->intensity !== null && $reflection->intensity_after !== null)
                        <p class="md-body-small md-reflection__intensity">
                            Intensidad registrada: {{ $entry->intensity }} de 5 antes y
                            {{ $reflection->intensity_after }} de 5 después.
                        </p>
                    @endif
                </section>
            @else
                <div class="md-reflection__progress" aria-label="Progreso de la reflexión">
                    <span class="md-label-small">Paso {{ $position }} de {{ $total }}</span>
                    <div class="md-progress-linear">
                        <div class="md-progress-linear-bar" style="width: {{ ($position / $total) * 100 }}%"></div>
                    </div>
                </div>

                <div class="md-reflection__step" wire:key="reflection-step-{{ $step }}">
                    <h3 class="md-title-medium" id="reflection-question">{{ $definition['question'] }}</h3>
                    <p class="md-body-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $definition['hint'] }}</p>

                    @if ($definition['type'] === 'scale')
                        <div class="md-mood-intensity__scale" role="group" aria-labelledby="reflection-question">
                            @foreach (range(1, 5) as $level)
                                <button type="button" wire:click="setScaleAnswer({{ $level }})"
                                        class="md-mood-intensity__step {{ $scaleAnswer === $level ? 'is-selected' : '' }}"
                                        aria-pressed="{{ $scaleAnswer === $level ? 'true' : 'false' }}"
                                        aria-label="Intensidad {{ $level }} de 5">{{ $level }}</button>
                            @endforeach
                        </div>
                    @else
                        <label class="md-visually-hidden" for="reflection-answer">{{ $definition['question'] }}</label>
                        <textarea wire:model="answer" id="reflection-answer" rows="4"
                                  class="md-reflection__input" placeholder="Escribe lo que quieras. También puedes omitir."></textarea>
                    @endif
                </div>
            @endif
        </div>

        <div class="md-dialog-actions md-reflection__actions">
            @if ($showSummary)
                <button type="button" wire:click="restart" class="md-btn-text"
                        wire:confirm="Se borrarán las respuestas de esta reflexión. La entrada emocional se conserva. ¿Continuar?">
                    Reiniciar
                </button>
                <button type="button" wire:click="reopen" class="md-btn-text">Seguir editando</button>
                <button type="button" wire:click="close" class="md-btn-filled">Cerrar</button>
            @else
                <button type="button" wire:click="finishForNow" class="md-btn-text">Terminar por ahora</button>
                @if ($position > 1)
                    <button type="button" wire:click="back" class="md-btn-text">Atrás</button>
                @endif
                <button type="button" wire:click="skip" class="md-btn-text">Omitir</button>
                <button type="button" wire:click="{{ $isLastStep ? 'complete' : 'continue' }}" class="md-btn-filled">
                    {{ $isLastStep ? 'Finalizar reflexión' : 'Continuar' }}
                </button>
            @endif
        </div>
    </div>
</div>
