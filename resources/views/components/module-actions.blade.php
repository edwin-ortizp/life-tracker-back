@props([
    'primary',
    'secondary' => [],
    'mobileStyle' => 'fab',
    'fabAlways' => false,
])

@php
    $secondary = collect($secondary)->filter()->values();
    $moduleKey = \App\Support\Ui\ModuleContext::current();
    $renderAction = static function (array $action, string $class, bool $menuItem = false): string {
        $label = e($action['label']);
        $icon = e($action['icon'] ?? 'bi-plus-lg');
        $content = '<i class="bi '.$icon.'" aria-hidden="true"></i><span>'.$label.'</span>';

        $role = $menuItem ? ' role="menuitem"' : '';

        if (! empty($action['href'])) {
            return '<a href="'.e($action['href']).'" class="'.$class.'"'.$role.'>'.$content.'</a>';
        }

        $binding = 'wire:click="'.e($action['action'] ?? '').'"';
        if (! empty($action['event'])) {
            $expression = '$dispatch('.json_encode($action['event']).', '.json_encode($action['detail'] ?? new \stdClass).')';
            $binding = 'x-on:click="'.e($expression).'"';
        }
        return '<button type="button" '.$binding.' class="'.$class.'"'.$role.'>'.$content.'</button>';
    };
@endphp

@if ($fabAlways)
    {{-- FAB independiente: se teletransporta a <body> para quedar por encima del
         contenido (acordeones, menús, paneles) sin depender de su contexto de apilamiento. --}}
    @if ($secondary->isNotEmpty())
        <div class="md-responsive-actions md-responsive-actions--fab-always" x-data="{ secondaryOpen: false }">
            <div class="md-mobile-action-menu">
                <button type="button" class="md-btn-icon md-mobile-action-menu__trigger"
                        @click="secondaryOpen = !secondaryOpen"
                        @click.outside="secondaryOpen = false"
                        :aria-expanded="secondaryOpen"
                        aria-haspopup="menu"
                        aria-label="Más acciones">
                    <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
                </button>
                <div class="md-mobile-action-menu__surface" x-cloak x-show="secondaryOpen" x-transition.origin.top.right role="menu">
                    @foreach ($secondary as $action)
                        {!! $renderAction($action, 'md-mobile-action-menu__item', true) !!}
                    @endforeach
                </div>
            </div>
        </div>
    @endif
    @teleport('body')
        <div class="md-fab-layer" data-module="{{ $moduleKey }}">
            {!! $renderAction($primary, 'md-fab md-fab-extended md-module-primary-fab') !!}
        </div>
    @endteleport
@else
<div class="md-responsive-actions {{ $fabAlways ? 'md-responsive-actions--fab-always' : '' }}" x-data="{ secondaryOpen: false }">
    <div class="md-responsive-actions__desktop">
        @foreach ($secondary as $action)
            {!! $renderAction($action, 'md-btn-outlined') !!}
        @endforeach
        {!! $renderAction($primary, 'md-btn-filled') !!}
    </div>

    <div class="md-responsive-actions__mobile">
        @if ($secondary->isNotEmpty())
            <div class="md-mobile-action-menu">
                <button type="button" class="md-btn-icon md-mobile-action-menu__trigger"
                        @click="secondaryOpen = !secondaryOpen"
                        @click.outside="secondaryOpen = false"
                        :aria-expanded="secondaryOpen"
                        aria-haspopup="menu"
                        aria-label="Más acciones">
                    <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
                </button>
                <div class="md-mobile-action-menu__surface" x-cloak x-show="secondaryOpen" x-transition.origin.top.right role="menu">
                    @foreach ($secondary as $action)
                        {!! $renderAction($action, 'md-mobile-action-menu__item', true) !!}
                    @endforeach
                </div>
            </div>
        @endif

        {!! $renderAction($primary, $mobileStyle === 'fab' ? 'md-fab md-fab-extended md-module-primary-fab' : 'md-btn-filled md-module-primary-inline') !!}
    </div>
</div>
@endif
