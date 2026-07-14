<x-module-shell module="settings">
    @if ($successMessage)
        <div class="md-card-filled mb-3 d-flex align-items-center justify-content-between" style="background: var(--md-custom-color-success-container); color: var(--md-custom-color-on-success-container);">
            <div class="d-flex align-items-center gap-2">
                <i class="bi bi-check-circle-fill"></i>
                <span class="md-body-medium">{{ $successMessage }}</span>
            </div>
            <button class="md-btn-icon" wire:click="$set('successMessage', '')" style="color: var(--md-custom-color-on-success-container);">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
    @endif

    {{-- Profile --}}
    <div class="md-card-outlined mb-3">
        <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-person" style="color: var(--md-sys-color-on-surface-variant); font-size: 1.25rem;"></i>
            <span class="md-title-medium" style="color: var(--md-sys-color-on-surface);">Perfil</span>
        </div>
        <div class="d-flex flex-column gap-3">
            <div class="md-text-field">
                <input type="text" wire:model="fullName" placeholder=" " id="set-name">
                <label for="set-name">Nombre completo</label>
            </div>
            <div class="md-text-field">
                <input type="email" value="{{ $email }}" disabled placeholder=" " id="set-email" style="color: var(--md-sys-color-on-surface-variant);">
                <label for="set-email">Email</label>
                <div class="md-supporting-text">El email no puede modificarse.</div>
            </div>
            <div>
                <button wire:click="updateProfile" class="md-btn-filled">
                    <i class="bi bi-check-lg"></i> Guardar Perfil
                </button>
            </div>
        </div>
    </div>

    {{-- Physical profile --}}
    <div class="md-card-outlined mb-3">
        <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-heart-pulse" style="color: var(--md-sys-color-on-surface-variant); font-size: 1.25rem;"></i>
            <span class="md-title-medium" style="color: var(--md-sys-color-on-surface);">Datos físicos</span>
        </div>
        <div class="d-flex flex-column gap-3">
            <div class="row g-3">
                <div class="col-sm-6">
                    <div class="md-text-field {{ $errors->has('currentWeightKg') ? 'md-error' : '' }}">
                        <input type="number" wire:model="currentWeightKg" placeholder=" " id="set-current-weight" min="20" max="500" step="0.1">
                        <label for="set-current-weight">Peso actual (kg)</label>
                        @error('currentWeightKg') <div class="md-supporting-text">{{ $message }}</div> @enderror
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="md-text-field {{ $errors->has('heightCm') ? 'md-error' : '' }}">
                        <input type="number" wire:model="heightCm" placeholder=" " id="set-height" min="50" max="300" step="1">
                        <label for="set-height">Estatura (cm)</label>
                        @error('heightCm') <div class="md-supporting-text">{{ $message }}</div> @enderror
                    </div>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-sm-6">
                    <div class="md-text-field {{ $errors->has('birthDate') ? 'md-error' : '' }}">
                        <input type="date" wire:model="birthDate" placeholder=" " id="set-birth-date">
                        <label for="set-birth-date">Fecha de nacimiento</label>
                        @error('birthDate') <div class="md-supporting-text">{{ $message }}</div> @enderror
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="md-text-field {{ $errors->has('lifeExpectancyYears') ? 'md-error' : '' }}">
                        <input type="number" wire:model="lifeExpectancyYears" placeholder=" " id="set-life-expectancy" min="1" max="130" step="1">
                        <label for="set-life-expectancy">Expectativa de vida (años)</label>
                        <div class="md-supporting-text">Referencia personal opcional para tu calendario de vida.</div>
                        @error('lifeExpectancyYears') <div class="md-supporting-text">{{ $message }}</div> @enderror
                    </div>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-sm-6">
                    <div class="md-text-field {{ $errors->has('activityLevel') ? 'md-error' : '' }}">
                        <select wire:model="activityLevel" id="set-activity-level">
                            <option value="">No especificado</option>
                            <option value="sedentary">Sedentario</option>
                            <option value="light">Ligero</option>
                            <option value="moderate">Moderado</option>
                            <option value="high">Alto</option>
                            <option value="very_high">Muy alto</option>
                        </select>
                        <label for="set-activity-level">Nivel de actividad</label>
                        @error('activityLevel') <div class="md-supporting-text">{{ $message }}</div> @enderror
                    </div>
                </div>
            </div>
            <div>
                <button wire:click="updateProfile" class="md-btn-filled">
                    <i class="bi bi-check-lg"></i> Guardar datos físicos
                </button>
            </div>
        </div>
    </div>

    <div class="md-card-outlined mb-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <div><div class="md-title-medium">Preferencias de cada módulo</div><p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">Las metas y catálogos específicos se administran dentro del módulo correspondiente.</p></div>
        <a href="{{ route('water.settings') }}" class="md-btn-outlined"><i class="bi bi-droplet"></i> Ajustes de hidratación</a>
    </div>

    {{-- Obsidian integration --}}
    <div class="md-card-outlined mb-3" style="border-color: var(--md-sys-color-primary);">
        <div class="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">
            <div class="d-flex align-items-center gap-2">
                <i class="bi bi-arrow-left-right" style="color: var(--md-sys-color-primary); font-size: 1.25rem;"></i>
                <div>
                    <div class="md-title-medium">Integración con Obsidian</div>
                    <div class="md-body-small" style="color: var(--md-sys-color-on-surface-variant);">Permite a n8n registrar resúmenes, ánimo y energía desde tus notas.</div>
                </div>
            </div>
            @if ($activeObsidianToken)
                <span class="md-label-medium px-2 py-1 rounded-pill" style="background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);">Activo</span>
            @endif
        </div>

        <div class="d-flex flex-column gap-3">
            <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">
                El token sólo permite acceder al catálogo de ánimo y crear registros importados. Guárdalo en las credenciales de n8n; LifeTracker nunca lo volverá a mostrar.
            </p>

            @if ($obsidianIntegrationToken)
                <div class="p-3 rounded" style="background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container);">
                    <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                        <span class="md-label-large">Token nuevo — cópialo ahora</span>
                        <button wire:click="hideObsidianToken" class="md-btn-icon" title="Ocultar token" style="color: inherit;"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <code class="d-block text-break user-select-all">{{ $obsidianIntegrationToken }}</code>
                </div>
            @endif

            <div class="d-flex align-items-center gap-2 flex-wrap">
                <button wire:click="createOrRotateObsidianToken" class="md-btn-filled">
                    <i class="bi bi-key"></i> {{ $activeObsidianToken ? 'Rotar token' : 'Generar token' }}
                </button>
                @if ($activeObsidianToken)
                    <button wire:click="revokeObsidianToken" wire:confirm="¿Revocar este token? n8n dejará de poder enviar registros." class="md-btn-outlined" style="color: var(--md-sys-color-error); border-color: var(--md-sys-color-error);">
                        <i class="bi bi-slash-circle"></i> Revocar
                    </button>
                    <span class="md-body-small" style="color: var(--md-sys-color-on-surface-variant);">Generado {{ $activeObsidianToken->created_at->diffForHumans() }}.</span>
                @endif
            </div>
        </div>
    </div>

    {{-- Change Password --}}
    <div class="md-card-outlined mb-3">
        <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-lock" style="color: var(--md-sys-color-on-surface-variant); font-size: 1.25rem;"></i>
            <span class="md-title-medium" style="color: var(--md-sys-color-on-surface);">Cambiar Contraseña</span>
        </div>
        <div class="d-flex flex-column gap-3">
            <div class="md-text-field {{ $errors->has('currentPassword') ? 'md-error' : '' }}">
                <input type="password" wire:model="currentPassword" placeholder=" " id="set-curpw">
                <label for="set-curpw">Contraseña actual</label>
                @error('currentPassword') <div class="md-supporting-text">{{ $message }}</div> @enderror
            </div>
            <div class="md-text-field {{ $errors->has('newPassword') ? 'md-error' : '' }}">
                <input type="password" wire:model="newPassword" placeholder=" " id="set-newpw">
                <label for="set-newpw">Nueva contraseña</label>
                @error('newPassword') <div class="md-supporting-text">{{ $message }}</div> @enderror
            </div>
            <div class="md-text-field {{ $errors->has('newPasswordConfirmation') ? 'md-error' : '' }}">
                <input type="password" wire:model="newPasswordConfirmation" placeholder=" " id="set-confpw">
                <label for="set-confpw">Confirmar nueva contraseña</label>
                @error('newPasswordConfirmation') <div class="md-supporting-text">{{ $message }}</div> @enderror
            </div>
            <div>
                <button wire:click="updatePassword" class="md-btn-tonal" style="background: var(--md-custom-color-warning-container); color: var(--md-custom-color-on-warning-container);">
                    <i class="bi bi-lock"></i> Cambiar Contraseña
                </button>
            </div>
        </div>
    </div>

    {{-- App Info --}}
    <div class="md-card-outlined">
        <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-info-circle" style="color: var(--md-sys-color-on-surface-variant); font-size: 1.25rem;"></i>
            <span class="md-title-medium" style="color: var(--md-sys-color-on-surface);">Aplicación</span>
        </div>
        <div class="d-flex flex-column gap-2">
            <div class="d-flex justify-content-between">
                <span class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant);">Versión</span>
                <span class="md-body-medium" style="color: var(--md-sys-color-on-surface);">1.0.0</span>
            </div>
            <div class="d-flex justify-content-between">
                <span class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant);">Stack</span>
                <span class="md-body-medium" style="color: var(--md-sys-color-on-surface);">Laravel {{ app()->version() }} + Livewire</span>
            </div>
            <div class="d-flex justify-content-between">
                <span class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant);">PHP</span>
                <span class="md-body-medium" style="color: var(--md-sys-color-on-surface);">{{ phpversion() }}</span>
            </div>
        </div>
    </div>
</x-module-shell>
