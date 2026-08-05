<x-module-shell module="settings">
    @if ($successMessage)
        <x-ui.snackbar>
            {{ $successMessage }}

            <x-slot:actions>
                <x-ui.icon-action icon="bi-x-lg" size="sm" label="Cerrar aviso" wire:click="$set('successMessage', '')" />
            </x-slot:actions>
        </x-ui.snackbar>
    @endif

    <x-ui.section title="Perfil" :level="2">
        <x-ui.card variant="outlined" icon="bi-person" iconTone="secondary">
            <x-ui.field name="fullName" label="Nombre completo" wire:model="fullName" />
            <x-ui.field name="settingsEmail" label="Email" type="email" :value="$email" :disabled="true"
                        help="El email no puede modificarse." />

            <x-slot:actions>
                <x-ui.action variant="filled" icon="bi-check-lg" wire:click="updateProfile">Guardar perfil</x-ui.action>
            </x-slot:actions>
        </x-ui.card>
    </x-ui.section>

    <x-ui.section title="Datos físicos" :level="2">
        <x-ui.card variant="outlined" icon="bi-heart-pulse" iconTone="secondary">
            <div class="md-field-pair">
                <x-ui.field name="currentWeightKg" label="Peso actual (kg)" type="number" min="20" max="500" step="0.1" wire:model="currentWeightKg" />
                <x-ui.field name="heightCm" label="Estatura (cm)" type="number" min="50" max="300" step="1" wire:model="heightCm" />
            </div>

            <div class="md-field-pair">
                <x-ui.field name="birthDate" label="Fecha de nacimiento" type="date" wire:model="birthDate" />
                <x-ui.field name="lifeExpectancyYears" label="Expectativa de vida (años)" type="number" min="1" max="130" step="1"
                            help="Referencia personal opcional para tu calendario de vida." wire:model="lifeExpectancyYears" />
            </div>

            <x-ui.select name="activityLevel" label="Nivel de actividad" placeholder="No especificado"
                         :options="[
                             'sedentary' => 'Sedentario',
                             'light' => 'Ligero',
                             'moderate' => 'Moderado',
                             'high' => 'Alto',
                             'very_high' => 'Muy alto',
                         ]"
                         wire:model="activityLevel" />

            <x-slot:actions>
                <x-ui.action variant="filled" icon="bi-check-lg" wire:click="updateProfile">Guardar datos físicos</x-ui.action>
            </x-slot:actions>
        </x-ui.card>
    </x-ui.section>

    <x-ui.section title="Preferencias de cada módulo"
                  description="Las metas y catálogos específicos se administran dentro del módulo correspondiente."
                  :level="2">
        <x-slot:actions>
            <x-ui.action variant="outlined" icon="bi-droplet" :href="route('water.settings')">Ajustes de hidratación</x-ui.action>
        </x-slot:actions>
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

    <x-ui.section title="Cambiar contraseña" :level="2">
        <x-ui.card variant="outlined" icon="bi-lock" iconTone="secondary">
            <x-ui.field name="currentPassword" label="Contraseña actual" type="password" wire:model="currentPassword" />
            <x-ui.field name="newPassword" label="Nueva contraseña" type="password" wire:model="newPassword" />
            <x-ui.field name="newPasswordConfirmation" label="Confirmar nueva contraseña" type="password" wire:model="newPasswordConfirmation" />

            <x-slot:actions>
                <x-ui.action variant="tonal" tone="warning" icon="bi-lock" wire:click="updatePassword">Cambiar contraseña</x-ui.action>
            </x-slot:actions>
        </x-ui.card>
    </x-ui.section>

    <x-ui.section title="Aplicación" :level="2">
        <x-ui.card variant="outlined" icon="bi-info-circle" iconTone="secondary">
            <dl class="md-context-list">
                <div><dt>Versión</dt><dd>1.0.0</dd></div>
                <div><dt>Stack</dt><dd>Laravel {{ app()->version() }} + Livewire</dd></div>
                <div><dt>PHP</dt><dd>{{ phpversion() }}</dd></div>
            </dl>
        </x-ui.card>
    </x-ui.section>
</x-module-shell>
