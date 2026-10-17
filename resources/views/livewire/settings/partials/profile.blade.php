<x-ui.section title="Perfil público" description="Tu nombre y correo dentro de MiSo." :level="2">
    <x-ui.card variant="outlined" icon="bi-person" iconTone="secondary">
        <x-ui.field name="fullName" label="Nombre completo" wire:model="fullName" />
        <x-ui.field name="settingsEmail" label="Email" type="email" :value="$email" :disabled="true"
                    help="El email no puede modificarse." />

        <x-slot:actions>
            <x-ui.action variant="filled" icon="bi-check-lg" wire:click="updateProfile">Guardar perfil</x-ui.action>
        </x-slot:actions>
    </x-ui.card>
</x-ui.section>

