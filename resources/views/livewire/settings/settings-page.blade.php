<x-module-shell module="settings">
    @if ($successMessage)
        <x-ui.snackbar>
            {{ $successMessage }}

            <x-slot:actions>
                <x-ui.icon-action icon="bi-x-lg" size="sm" label="Cerrar aviso" wire:click="$set('successMessage', '')" />
            </x-slot:actions>
        </x-ui.snackbar>
    @endif

    <div class="settings-layout">
        <div class="settings-content">
            @include('livewire.settings.partials.'.$section)
        </div>

        @include('livewire.settings.partials.nav')
    </div>
</x-module-shell>
