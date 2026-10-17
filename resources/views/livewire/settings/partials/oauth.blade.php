<x-ui.section title="Aplicaciones OAuth"
              description="Herramientas externas que conectaste con tu cuenta por OAuth, como ChatGPT o Claude."
              :level="2">
    <x-ui.card variant="outlined" icon="bi-plug" iconTone="secondary">
        @forelse ($connectedApps as $app)
            <div class="settings-row" wire:key="connected-app-{{ $app->id }}">
                <div class="settings-row__body">
                    <p class="md-title-small mb-0">{{ $app->client->name }}</p>
                    <p class="md-body-small mb-0">
                        Conectada {{ $app->created_at->diffForHumans() }}.
                        @if ($app->expires_at)
                            Caduca {{ $app->expires_at->diffForHumans() }}.
                        @endif
                    </p>
                </div>
                <x-ui.destructive-action label="Revocar {{ $app->client->name }}" icon="bi-slash-circle" variant="outlined"
                                         action="revokeConnectedApp('{{ $app->id }}')"
                                         title="Revocar el acceso"
                                         message="“{{ $app->client->name }}” dejará de poder acceder a tus datos. Puedes volver a conectarla cuando quieras." />
            </div>
        @empty
            <p class="md-body-medium mb-0">
                Todavía no has conectado ninguna aplicación. Para hacerlo, añade la URL del servidor MCP
                como conector en la herramienta que uses y autoriza el acceso desde allí.
            </p>
        @endforelse
    </x-ui.card>
</x-ui.section>

<x-ui.section title="Token de IA"
              description="Alternativa a OAuth para clientes MCP que solo aceptan una cabecera Authorization: Bearer."
              :level="2">
    <x-ui.card variant="outlined" icon="bi-stars" iconTone="secondary">
        <x-slot:header>
            @if ($activeAiToken)
                <x-ui.chip variant="tonal" tone="primary">Activo</x-ui.chip>
            @endif
        </x-slot:header>

        <p class="md-body-small">
            Solo puede leer y modificar tus propios datos; MiSo nunca volverá a mostrar el token.
        </p>

        @if ($aiIntegrationToken)
            <div class="md-secret">
                <div class="md-secret__header">
                    <span class="md-label-large">Token nuevo — cópialo ahora</span>
                    <x-ui.icon-action icon="bi-x-lg" size="sm" label="Ocultar token" wire:click="hideAiToken" />
                </div>
                <code class="md-secret__value">{{ $aiIntegrationToken }}</code>
            </div>
        @endif

        @if ($activeAiToken)
            <p class="md-body-small">Último uso: {{ $activeAiToken->last_used_at?->diffForHumans() ?? 'nunca' }}.</p>
        @endif

        <x-slot:actions>
            <x-ui.action variant="filled" icon="bi-key" wire:click="createOrRotateAiToken">
                {{ $activeAiToken ? 'Rotar token' : 'Generar token' }}
            </x-ui.action>
            @if ($activeAiToken)
                <x-ui.destructive-action label="Revocar" icon="bi-slash-circle" variant="outlined"
                                         action="revokeAiToken"
                                         title="Revocar el token de IA"
                                         message="El asistente de IA dejará de poder acceder a tus datos con este token." />
            @endif
        </x-slot:actions>
    </x-ui.card>
</x-ui.section>
