@props([
    'steps' => [],
    'current' => 1,
    'label' => 'Progreso del flujo',
])

<nav aria-label="{{ $label }}">
    <ol {{ $attributes->class(['md-flow-steps']) }}>
        @foreach ($steps as $index => $step)
            @php $number = $index + 1; @endphp
            <li class="md-flow-step md-label-medium" @if ($number === (int) $current) aria-current="step" @endif>
                <span class="md-flow-step__marker" aria-hidden="true">{{ $number }}</span>
                <span>{{ $step }}</span>
            </li>
        @endforeach
    </ol>
</nav>
