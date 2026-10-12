@php($aboutText = collect($about)->map(fn ($row) => $row[0].': '.$row[1])->implode("\n"))

<x-ui.section title="Acerca de" description="Versiones y entorno de esta instalación." :level="2">
    <x-ui.card variant="outlined" icon="bi-info-circle" iconTone="secondary">
        <dl class="md-context-list">
            @foreach ($about as [$label, $value, $icon])
                <div><dt><i class="bi {{ $icon }}" aria-hidden="true"></i> {{ $label }}</dt><dd class="md-secret__value">{{ $value }}</dd></div>
            @endforeach
        </dl>

        <x-slot:actions>
            <div x-data="{ copied: false, text: @js($aboutText) }">
                <x-ui.action variant="tonal" icon="bi-clipboard"
                             x-on:click="navigator.clipboard.writeText(text); copied = true; setTimeout(() => copied = false, 2000)">
                    <span x-text="copied ? 'Copiado' : 'Copiar información'">Copiar información</span>
                </x-ui.action>
            </div>
        </x-slot:actions>
    </x-ui.card>
</x-ui.section>
