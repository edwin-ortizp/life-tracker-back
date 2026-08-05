@props([
    'title',
    'description' => null,
    'code' => null,
])

<article class="md-catalog__example">
    <header class="md-catalog__example-header">
        <h3 class="md-title-small">{{ $title }}</h3>
        @if ($description)<p class="md-body-small">{{ $description }}</p>@endif
    </header>

    <div class="md-catalog__demo">{{ $slot }}</div>

    @if ($code)
        <pre class="md-catalog__code"><code>{{ trim($code) }}</code></pre>
    @endif
</article>
