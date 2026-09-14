@props(['title', 'icon' => 'bi-stars', 'tone' => 'primary', 'menuLabel' => null])

<section {{ $attributes->class(['md-context-widget', "md-context-widget--{$tone}"]) }}>
    <header class="md-context-widget__header">
        <span class="md-context-widget__icon"><i class="bi {{ $icon }}" aria-hidden="true"></i></span>
        <h2>{{ $title }}</h2>
        @isset($menu)
            <x-ui.menu size="sm" :label="$menuLabel ?? 'Más acciones de '.\Illuminate\Support\Str::lower($title)" class="md-context-widget__menu">{{ $menu }}</x-ui.menu>
        @endisset
    </header>
    <div class="md-context-widget__content">{{ $slot }}</div>
</section>
