@props([
    'state',
    'title',
    'icon' => null,
    'module' => null,
    'steps' => [],
    'saveAction' => 'save',
    'saveLabel' => 'Guardar',
    'bulkAction' => null,
    'bulkSaveLabel' => null,
    'closeAction' => null,
    'wide' => false,
])

@php
    $multi = count($steps) > 1;
    // Cerrar siempre debe pasar por el servidor: si solo se apagara el booleano
    // entrelazado (`{{ $state }} = false`), `editingId` y el resto del formulario
    // se quedarían con los datos de la última edición para la próxima apertura.
    $close = $closeAction ? '$wire.call(\''.$closeAction.'\')' : "{$state} = false";
@endphp

{{-- x-show (no <template x-if>): un `x-if` de Alpine clona el contenido del
     <template> una sola vez y Livewire no vuelve a tocar ese contenido inerte
     en renders posteriores (morphdom no recorre `<template>`), así que el
     texto condicional al servidor (título, raíl, switch de alta masiva) se
     quedaría congelado en lo que había la primera vez que se abrió el modal.
     Con `x-show` el elemento vive siempre en el DOM real y Livewire lo
     actualiza con el diffing normal en cada render. --}}
<div x-data="{ step: 0, bulk: false }" x-show="{{ $state }}" x-cloak
     x-effect="if ({{ $state }}) { step = 0; bulk = false }">
        <div class="md-dialog-scrim" @click="{{ $close }}"></div>
        <div {{ $attributes->class(['md-dialog', 'md-dialog--large', $wide ? 'lt-cm-modal--wide' : '']) }}
             role="dialog" aria-modal="true" @if($module) data-module="{{ $module }}" @endif @click.stop>
            <div class="md-dialog-header">
                <div class="lt-cm-head">
                    @if ($icon)
                        <span class="lt-cm-icon" aria-hidden="true"><i class="bi {{ $icon }}"></i></span>
                    @endif
                    <div class="lt-cm-head-body">
                        <h2>{{ $title }}</h2>
                        @if ($multi)
                            <p x-text="'Paso ' + (step + 1) + ' de {{ count($steps) }} · ' + [{{ collect($steps)->pluck('label')->map(fn ($l) => "'".addslashes($l)."'")->implode(', ') }}][step]"></p>
                        @endif
                    </div>
                </div>
                <x-ui.icon-action icon="bi-x-lg" label="Cerrar" @click="{{ $close }}" />
            </div>

            <div class="lt-cm-body">
                @if ($multi)
                    <nav class="lt-cm-rail" aria-label="{{ 'Pasos de '.mb_strtolower($title) }}">
                        @foreach ($steps as $i => $s)
                            <button type="button" class="lt-cm-step" :class="{ 'is-active': step === {{ $i }} }" @click="step = {{ $i }}">
                                <span class="lt-cm-step__marker" aria-hidden="true">{{ $i + 1 }}</span>
                                <span>{{ $s['label'] }}<small>{{ $i === 0 ? 'Obligatorio' : 'Opcional' }}</small></span>
                            </button>
                        @endforeach
                        <p class="lt-cm-rail__note">Puedes guardar en cuanto el primer paso esté completo; el resto se rellena después.</p>
                    </nav>
                @endif

                <div class="md-dialog-content">
                    {{ $slot }}
                </div>
            </div>

            <div class="md-dialog-actions">
                @isset($actions)
                    {{ $actions }}
                @endisset
                <button type="button" class="md-btn-text" @click="{{ $close }}">Cancelar</button>
                <span class="md-dialog-actions__spacer"></span>
                @if ($multi)
                    <button type="button" class="md-btn-text" x-show="step > 0" x-cloak @click="step--">
                        <i class="bi bi-arrow-left" aria-hidden="true"></i> Atrás
                    </button>
                    <button type="button" class="md-btn-outlined" x-show="step < {{ count($steps) - 1 }}" x-cloak @click="step++">
                        Siguiente <i class="bi bi-arrow-right" aria-hidden="true"></i>
                    </button>
                @endif
                @if ($bulkAction)
                    <button type="button" class="md-btn-filled" @click="$wire.call(bulk ? '{{ $bulkAction }}' : '{{ $saveAction }}')">
                        <i class="bi bi-check-lg" aria-hidden="true"></i>
                        <span x-text="bulk ? '{{ addslashes($bulkSaveLabel ?? $saveLabel) }}' : '{{ addslashes($saveLabel) }}'"></span>
                    </button>
                @else
                    <button type="button" class="md-btn-filled" wire:click="{{ $saveAction }}">
                        <i class="bi bi-check-lg" aria-hidden="true"></i> {{ $saveLabel }}
                    </button>
                @endif
            </div>
        </div>
</div>
