@props([
    'open' => false,
    'close',
    'title',
    'icon' => null,
    'sections' => [],
    'submit' => 'Guardar',
    'submitAction' => null,
    'id' => null,
])

@php
    abort_unless(filled($close), 500, 'Un diálogo de formulario debe declarar la acción que lo cierra.');

    $dialogId = $id ?? 'form-dialog-'.\Illuminate\Support\Str::slug($title);
    $firstSection = array_key_first($sections);
@endphp

{{--
    Modal de formulario canónico: cabecera y footer con divisoria, secciones
    opcionales (menú lateral colapsable, no un wizard), expandir/restaurar y
    Cancelar a la izquierda / Guardar a la derecha. Se renderiza desde el
    servidor; el estado de sección, colapso y expansión vive en Alpine y
    sobrevive a cada actualización de Livewire.
--}}
@if ($open)
    <div class="md-form-dialog-layer"
         x-data="{ section: @js($firstSection), navCollapsed: window.matchMedia('(max-width: 767.98px)').matches, expanded: false }">
        <div class="md-dialog-scrim" wire:click="{{ $close }}"></div>
        <section {{ $attributes->class(['md-form-dialog', 'md-form-dialog--sections' => $sections !== []]) }}
                 :class="{ 'is-expanded': expanded, 'is-nav-collapsed': navCollapsed }"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="{{ $dialogId }}-title"
                 x-md-surface
                 @md-surface-close="$refs.cancel.click()">
            <form class="md-form-dialog__form" @if ($submitAction) wire:submit="{{ $submitAction }}" @else @submit.prevent @endif>
                <header class="md-form-dialog__head">
                    @if ($sections !== [])
                        <button type="button" class="md-btn-icon" @click="navCollapsed = !navCollapsed"
                                :aria-expanded="(!navCollapsed).toString()" aria-controls="{{ $dialogId }}-nav"
                                aria-label="Mostrar u ocultar secciones" title="Secciones">
                            <i class="bi bi-layout-sidebar" aria-hidden="true"></i>
                        </button>
                    @endif
                    @if ($icon)
                        <span class="md-form-dialog__icon"><i class="bi {{ $icon }}" aria-hidden="true"></i></span>
                    @endif
                    <h2 id="{{ $dialogId }}-title" class="md-form-dialog__title">{{ $title }}</h2>
                    <button type="button" class="md-btn-icon" @click="expanded = !expanded"
                            :aria-pressed="expanded.toString()" :aria-label="expanded ? 'Restaurar' : 'Expandir'" :title="expanded ? 'Restaurar' : 'Expandir'">
                        <i class="bi" :class="expanded ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="md-btn-icon" wire:click="{{ $close }}" aria-label="Cerrar" title="Cerrar">
                        <i class="bi bi-x-lg" aria-hidden="true"></i>
                    </button>
                </header>

                <div class="md-form-dialog__main">
                    @if ($sections !== [])
                        <nav id="{{ $dialogId }}-nav" class="md-form-dialog__nav" aria-label="Secciones del formulario">
                            @foreach ($sections as $key => $section)
                                <button type="button" class="md-form-dialog__nav-item"
                                        @click="section = @js($key); if (window.matchMedia('(max-width: 767.98px)').matches) navCollapsed = true"
                                        :aria-current="section === @js($key) ? 'true' : null">
                                    <i class="bi {{ $section['icon'] }}" aria-hidden="true"></i>
                                    <span>{{ $section['label'] }}</span>
                                    @if (! empty($section['error']))
                                        <span class="md-form-dialog__nav-dot" role="img" aria-label="Contiene errores"></span>
                                    @endif
                                </button>
                            @endforeach
                        </nav>
                    @endif
                    <div class="md-form-dialog__body">{{ $slot }}</div>
                </div>

                <footer class="md-form-dialog__actions">
                    <button type="button" x-ref="cancel" class="md-btn-text" wire:click="{{ $close }}">Cancelar</button>
                    <button type="submit" class="md-btn-filled" wire:loading.attr="disabled">
                        <i class="bi bi-floppy" aria-hidden="true"></i>
                        <span>{{ $submit }}</span>
                    </button>
                </footer>
            </form>
        </section>
    </div>
@endif
