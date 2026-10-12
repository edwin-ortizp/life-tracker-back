<x-ui.section title="Contraseña y seguridad" description="Cambia tu contraseña y revisa dónde tienes la sesión abierta." :level="2">
    <x-ui.card variant="outlined" icon="bi-lock" iconTone="secondary">
        <x-ui.field name="currentPassword" label="Contraseña actual" type="password" wire:model="currentPassword" />
        <x-ui.field name="newPassword" label="Nueva contraseña" type="password" wire:model="newPassword" />
        <x-ui.field name="newPasswordConfirmation" label="Confirmar nueva contraseña" type="password" wire:model="newPasswordConfirmation" />

        <x-slot:actions>
            <x-ui.action variant="tonal" tone="warning" icon="bi-lock" wire:click="updatePassword">Cambiar contraseña</x-ui.action>
        </x-slot:actions>
    </x-ui.card>
</x-ui.section>

<x-ui.section title="Sesiones activas" :level="2">
    <x-ui.card variant="outlined" icon="bi-laptop" iconTone="secondary">
        @forelse ($sessions as $session)
            <div class="settings-row" wire:key="session-{{ $session->id }}">
                <div class="settings-row__body">
                    <p class="md-title-small mb-0">{{ $session->device }}</p>
                    <p class="md-body-small mb-0">{{ $session->ip }} · {{ $session->lastActivity->diffForHumans() }}</p>
                </div>
                @if ($session->current)
                    <x-ui.chip variant="tonal" tone="success">Esta sesión</x-ui.chip>
                @else
                    <x-ui.action variant="text" wire:click="closeSession('{{ $session->id }}')"
                                 wire:confirm="¿Cerrar la sesión de {{ $session->device }}?">Cerrar</x-ui.action>
                @endif
            </div>
        @empty
            <p class="md-body-medium mb-0">No hay información de sesiones disponible.</p>
        @endforelse
    </x-ui.card>
</x-ui.section>
