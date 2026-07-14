@props(['title', 'icon' => 'bi-stars', 'tone' => 'primary'])

<section {{ $attributes->class(['md-context-widget', "md-context-widget--{$tone}"]) }}>
    <header class="md-context-widget__header">
        <span class="md-context-widget__icon"><i class="bi {{ $icon }}" aria-hidden="true"></i></span>
        <h2>{{ $title }}</h2>
    </header>
    <div class="md-context-widget__content">{{ $slot }}</div>
</section>
