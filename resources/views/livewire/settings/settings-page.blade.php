<div>
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-gear text-secondary"></i> Ajustes</h4>
    </div>

    @if ($successMessage)
        <div class="alert alert-success alert-dismissible fade show">
            {{ $successMessage }}
            <button type="button" class="btn-close" wire:click="$set('successMessage', '')"></button>
        </div>
    @endif

    {{-- Profile --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-person"></i> Perfil</h6>
        </div>
        <div class="card-body">
            <div class="mb-3">
                <label class="form-label">Nombre completo</label>
                <input type="text" wire:model="fullName" class="form-control">
            </div>
            <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" value="{{ $email }}" disabled>
                <small class="text-muted">El email no puede modificarse.</small>
            </div>
            <button wire:click="updateProfile" class="btn btn-primary">
                <i class="bi bi-check-lg"></i> Guardar Perfil
            </button>
        </div>
    </div>

    {{-- Change Password --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-lock"></i> Cambiar Contraseña</h6>
        </div>
        <div class="card-body">
            <div class="mb-3">
                <label class="form-label">Contraseña actual</label>
                <input type="password" wire:model="currentPassword" class="form-control">
                @error('currentPassword') <small class="text-danger">{{ $message }}</small> @enderror
            </div>
            <div class="mb-3">
                <label class="form-label">Nueva contraseña</label>
                <input type="password" wire:model="newPassword" class="form-control">
                @error('newPassword') <small class="text-danger">{{ $message }}</small> @enderror
            </div>
            <div class="mb-3">
                <label class="form-label">Confirmar nueva contraseña</label>
                <input type="password" wire:model="newPasswordConfirmation" class="form-control">
                @error('newPasswordConfirmation') <small class="text-danger">{{ $message }}</small> @enderror
            </div>
            <button wire:click="updatePassword" class="btn btn-warning">
                <i class="bi bi-lock"></i> Cambiar Contraseña
            </button>
        </div>
    </div>

    {{-- App Info --}}
    <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-info-circle"></i> Aplicación</h6>
        </div>
        <div class="card-body">
            <table class="table table-sm table-borderless mb-0">
                <tr>
                    <td class="text-muted">Versión</td>
                    <td>1.0.0</td>
                </tr>
                <tr>
                    <td class="text-muted">Stack</td>
                    <td>Laravel {{ app()->version() }} + Livewire</td>
                </tr>
                <tr>
                    <td class="text-muted">PHP</td>
                    <td>{{ phpversion() }}</td>
                </tr>
            </table>
        </div>
    </div>
</div>
