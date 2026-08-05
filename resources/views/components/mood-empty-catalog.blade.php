@props(['action' => 'restoreMoodCatalog'])

{{--
    Shown by Ánimo, Inicio and Diario when no emotion is available to log. Nothing is
    restored on its own: an entirely deactivated catalog can be a deliberate choice.
--}}

<x-empty-state title="Aún no hay emociones para registrar" icon="bi-emoji-neutral"
               message="Restaura el catálogo predeterminado o crea las tuyas desde Ajustes.">
    <x-slot:action>
        <button type="button" wire:click="{{ $action }}" class="md-btn-filled">
            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Restaurar catálogo
        </button>
        <a href="{{ route('mood.settings') }}" class="md-btn-text">
            <i class="bi bi-sliders" aria-hidden="true"></i> Configurar emociones
        </a>
    </x-slot:action>
</x-empty-state>
