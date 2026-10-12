<x-ui.section title="Tareas por CalDAV"
              description="Sincroniza tus tareas con DAVx5, Tasks.org y otros clientes CalDAV."
              :level="2">
    <x-ui.card variant="outlined" icon="bi-calendar-check" iconTone="secondary">
        <x-slot:header>
            @if ($activeCalDavToken)
                <x-ui.chip variant="tonal">Activo</x-ui.chip>
            @endif
        </x-slot:header>

        <dl class="md-context-list">
            <div><dt>Servidor</dt><dd class="md-secret__value">{{ $calDavUrl }}</dd></div>
            <div><dt>Usuario</dt><dd class="md-secret__value">{{ auth()->user()->email }}</dd></div>
            <div><dt>Lista</dt><dd>Life Tracker</dd></div>
        </dl>

        <p class="md-body-small">
            En Tasks.org activa «dejar que el servidor programe tareas recurrentes». Usa HTTPS fuera de tu red local.
        </p>

        @if ($calDavPassword)
            <div class="md-secret">
                <div class="md-secret__header">
                    <span class="md-label-large">Contraseña nueva — cópiala ahora</span>
                    <x-ui.icon-action icon="bi-x-lg" size="sm" label="Ocultar contraseña" wire:click="hideCalDavPassword" />
                </div>
                <code class="md-secret__value">{{ $calDavPassword }}</code>
            </div>
        @endif

        @if ($activeCalDavToken)
            <p class="md-body-small">Último uso: {{ $activeCalDavToken->last_used_at?->diffForHumans() ?? 'nunca' }}.</p>
        @endif

        <x-slot:actions>
            <x-ui.action variant="filled" icon="bi-key" wire:click="createOrRotateCalDavPassword">
                {{ $activeCalDavToken ? 'Rotar contraseña' : 'Generar contraseña' }}
            </x-ui.action>
            @if ($activeCalDavToken)
                <x-ui.destructive-action label="Revocar" icon="bi-slash-circle" variant="outlined"
                                         action="revokeCalDavPassword"
                                         title="Revocar el acceso CalDAV"
                                         message="Los dispositivos dejarán de sincronizar tus tareas." />
            @endif
        </x-slot:actions>
    </x-ui.card>
</x-ui.section>

<x-ui.section title="Integración con Obsidian"
              description="Permite a n8n registrar resúmenes, ánimo y energía desde tus notas."
              :level="2">
    <x-ui.card variant="outlined" icon="bi-arrow-left-right">
        <x-slot:header>
            @if ($activeObsidianToken)
                <x-ui.chip variant="tonal" tone="primary">Activo</x-ui.chip>
            @endif
        </x-slot:header>

        <p class="md-body-small">
            El token sólo permite acceder al catálogo de ánimo y crear registros importados. Guárdalo en las
            credenciales de n8n; LifeTracker nunca lo volverá a mostrar.
        </p>

        @if ($obsidianIntegrationToken)
            <div class="md-secret">
                <div class="md-secret__header">
                    <span class="md-label-large">Token nuevo — cópialo ahora</span>
                    <x-ui.icon-action icon="bi-x-lg" size="sm" label="Ocultar token" wire:click="hideObsidianToken" />
                </div>
                <code class="md-secret__value">{{ $obsidianIntegrationToken }}</code>
            </div>
        @endif

        @if ($activeObsidianToken)
            <p class="md-body-small">Generado {{ $activeObsidianToken->created_at->diffForHumans() }}.</p>
        @endif

        <x-slot:actions>
            <x-ui.action variant="filled" icon="bi-key" wire:click="createOrRotateObsidianToken">
                {{ $activeObsidianToken ? 'Rotar token' : 'Generar token' }}
            </x-ui.action>
            @if ($activeObsidianToken)
                <x-ui.destructive-action label="Revocar" icon="bi-slash-circle" variant="outlined"
                                         action="revokeObsidianToken"
                                         title="Revocar el token de Obsidian"
                                         message="n8n dejará de poder enviar registros con este token." />
            @endif
        </x-slot:actions>
    </x-ui.card>
</x-ui.section>
