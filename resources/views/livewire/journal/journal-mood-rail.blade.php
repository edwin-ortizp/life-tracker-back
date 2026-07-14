<div class="md-context-rail journal-context-rail">
    <x-context-widget title="¿Cómo te sientes?" icon="bi-emoji-smile" tone="success">
        @if ($lastMood)
            <div class="journal-mood-current"><span>{{ $lastMood->emoji }}</span><div><strong>{{ $lastMood->text }}</strong><small>{{ $lastMood->time }}</small></div></div>
        @endif
        <div class="journal-mood-picker" aria-label="Registrar estado de ánimo">
            @foreach ($moodStates as $state)
                <button wire:click="saveMood('{{ $state->id }}')" title="{{ $state->text }}" aria-label="Registrar {{ $state->text }}"><span>{{ $state->emoji }}</span><small>{{ $state->text }}</small></button>
            @endforeach
        </div>
    </x-context-widget>

    <x-context-widget title="Energía" icon="bi-lightning-charge" tone="warning">
        @if ($lastEnergy)<p class="mb-2"><strong>{{ $lastEnergy->level }}/5</strong> · último registro {{ $lastEnergy->time }}</p>@endif
        <form wire:submit="saveEnergy" class="d-grid gap-2">
            <div class="journal-energy-scale">
                @foreach (range(1, 5) as $level)
                    <button type="button" wire:click="$set('energyLevel', {{ $level }})" class="{{ $energyLevel === $level ? 'is-selected' : '' }}" aria-label="Energía {{ $level }} de 5">{{ $level }}</button>
                @endforeach
            </div>
            <label class="visually-hidden" for="journal-energy-comment">Comentario de energía</label>
            <input wire:model="energyComment" id="journal-energy-comment" class="form-control form-control-sm" placeholder="Comentario opcional">
            <button class="md-btn-tonal w-100">Registrar energía</button>
        </form>
    </x-context-widget>

    <x-context-widget title="Conecta los puntos" icon="bi-stars">
        <p class="mb-2">Escribir junto a tu estado de ánimo ayuda a reconocer qué situaciones cambian tu energía.</p>
        <a href="{{ route('mood', ['date' => $selectedDate]) }}" class="md-btn-text w-100">Abrir historial emocional</a>
    </x-context-widget>
</div>
