@props([
    'name',
    'title',
    'description' => null,
])

{{-- Sección de un x-ui.form-dialog. Se oculta en el cliente para conservar los datos al cambiar de sección. --}}
<section {{ $attributes->class(['md-form-dialog__section']) }} x-show="section === @js($name)" x-cloak>
    <header class="md-form-dialog__section-head">
        <h3>{{ $title }}</h3>
        @if ($description)<p>{{ $description }}</p>@endif
    </header>
    {{ $slot }}
</section>
