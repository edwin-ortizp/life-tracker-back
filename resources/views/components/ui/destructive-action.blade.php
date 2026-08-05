@props([
    'label',
    'action' => null,
    'href' => null,
    'icon' => 'bi-trash',
    'iconOnly' => false,
    'variant' => 'text',
    'size' => 'md',
    'risk' => 'material',
    'title' => null,
    'message' => null,
    'confirmLabel' => null,
])

@php
    $risks = ['reversible', 'material'];

    abort_unless(in_array($risk, $risks, true), 500, "Nivel de riesgo no soportado: {$risk}");
    abort_unless($action || $href, 500, 'Una acción destructiva debe declarar `action` o `href`.');

    // `reversible` se ejecuta directamente; `material` elimina información y pide confirmación.
    $confirms = $risk === 'material';
    $dialogTitle = $title ?? $label;
    $dialogMessage = $message ?? 'Esta acción elimina información de forma permanente.';
    $confirmText = $confirmLabel ?? $label;
@endphp

@if (! $confirms)
    @if ($iconOnly)
        <x-ui.icon-action :icon="$icon" :label="$label" tone="danger" :size="$size" :href="$href" {{ $attributes }} />
    @else
        <x-ui.action :variant="$variant" tone="danger" :size="$size" :icon="$icon" :href="$href" {{ $attributes }}>{{ $label }}</x-ui.action>
    @endif
@else
    <span class="md-destructive-action" x-data="{ confirming: false }">
        @if ($iconOnly)
            <x-ui.icon-action :icon="$icon" :label="$label" tone="danger" :size="$size" x-on:click="confirming = true" />
        @else
            <x-ui.action :variant="$variant" tone="danger" :size="$size" :icon="$icon" x-on:click="confirming = true">{{ $label }}</x-ui.action>
        @endif

        <x-ui.dialog state="confirming" :title="$dialogTitle" icon="bi-exclamation-triangle">
            <p class="md-body-medium">{{ $dialogMessage }}</p>

            <x-slot:actions>
                <x-ui.action variant="text" x-on:click="confirming = false">Cancelar</x-ui.action>
                @if ($href)
                    <x-ui.action variant="filled" tone="danger" :href="$href">{{ $confirmText }}</x-ui.action>
                @else
                    <x-ui.action variant="filled" tone="danger" wire:click="{{ $action }}" x-on:click="confirming = false">{{ $confirmText }}</x-ui.action>
                @endif
            </x-slot:actions>
        </x-ui.dialog>
    </span>
@endif
