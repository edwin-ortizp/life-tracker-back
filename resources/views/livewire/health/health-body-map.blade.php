<x-module-shell module="health" class="health-page">
    <x-slot:actions><x-module-actions :primary="['label' => 'Registrar síntoma', 'icon' => 'bi-plus-lg', 'href' => route('health')]" /></x-slot:actions>

    <section class="health-body-hero mb-3">
        <div>
            <p class="health-eyebrow"><i class="bi bi-activity"></i> Mapa de intensidad</p>
            <h2 class="md-headline-small mb-2">Tu cuerpo, visto a través del registro</h2>
            <p class="mb-0">El color reúne frecuencia e intensidad de los síntomas guardados en cada zona.</p>
        </div>
        <div class="health-body-total"><strong>{{ $totalSymptoms }}</strong><span>síntomas<br>registrados</span></div>
    </section>

    <div class="md-chip-rail mb-3">
        @foreach(['30' => 'Últimos 30 días', '90' => 'Últimos 90 días', 'all' => 'Todo el historial'] as $value => $label)
            <button wire:click="$set('period', '{{ $value }}')" class="md-chip md-chip-filter {{ $period === $value ? 'selected' : '' }}">{{ $label }}</button>
        @endforeach
    </div>

    <section class="health-body-layout">
        <div class="md-card-elevated health-body-map-card">
            <div class="health-body-map-card__header"><div><span class="health-type-chip">Lectura visual</span><h2 class="md-title-large mb-0">Mapa corporal</h2></div><span class="health-heat-key"><i></i> Menor <b></b> Mayor</span></div>
            <div class="health-figure-wrap">
                <svg class="health-figure" viewBox="0 0 360 620" role="img" aria-labelledby="body-map-title body-map-description">
                    <title id="body-map-title">Mapa corporal de síntomas</title><desc id="body-map-description">Las zonas con mayor acumulación de síntomas e intensidad se ven más oscuras.</desc>
                    @php($heat = fn ($area) => ($areas[$area]['severity'] / $maximumSeverity))
                    <g class="health-figure-silhouette">
                        <ellipse class="health-region health-region--head" style="--health-heat: {{ $heat('head') }}" cx="180" cy="72" rx="44" ry="52"><title>Cabeza: {{ $areas['head']['count'] }} registros</title></ellipse>
                        <path class="health-region health-region--face" style="--health-heat: {{ $heat('eyes_face') }}" d="M148 72 Q180 92 212 72 L212 96 Q180 112 148 96Z"><title>Ojos y cara: {{ $areas['eyes_face']['count'] }} registros</title></path>
                        <rect class="health-region health-region--throat" style="--health-heat: {{ max($heat('mouth_throat'), $heat('neck')) }}" x="160" y="118" width="40" height="34" rx="12"><title>Boca, garganta y cuello</title></rect>
                        <path class="health-region health-region--chest" style="--health-heat: {{ $heat('chest') }}" d="M126 150 Q180 132 234 150 L250 250 Q180 276 110 250Z"><title>Pecho: {{ $areas['chest']['count'] }} registros</title></path>
                        <path class="health-region health-region--abdomen" style="--health-heat: {{ $heat('abdomen') }}" d="M110 252 Q180 275 250 252 L240 347 Q180 365 120 347Z"><title>Abdomen: {{ $areas['abdomen']['count'] }} registros</title></path>
                        <path class="health-region health-region--pelvis" style="--health-heat: {{ $heat('hips_pelvis') }}" d="M120 347 Q180 365 240 347 L231 391 L129 391Z"><title>Cadera y pelvis: {{ $areas['hips_pelvis']['count'] }} registros</title></path>
                        <path class="health-region health-region--shoulders" style="--health-heat: {{ $heat('shoulders') }}" d="M126 153 L90 181 L106 245 L126 232ZM234 153 L270 181 L254 245 L234 232Z"><title>Hombros: {{ $areas['shoulders']['count'] }} registros</title></path>
                        <path class="health-region health-region--arms" style="--health-heat: {{ $heat('arms') }}" d="M91 181 L58 317 L83 323 L119 223ZM269 181 L302 317 L277 323 L241 223Z"><title>Brazos: {{ $areas['arms']['count'] }} registros</title></path>
                        <path class="health-region health-region--hands" style="--health-heat: {{ $heat('hands') }}" d="M58 317 L51 359 Q61 377 82 361 L83 323ZM302 317 L309 359 Q299 377 278 361 L277 323Z"><title>Manos y muñecas: {{ $areas['hands']['count'] }} registros</title></path>
                        <path class="health-region health-region--legs" style="--health-heat: {{ $heat('legs') }}" d="M130 392 L171 392 L164 515 L123 515ZM189 392 L230 392 L237 515 L196 515Z"><title>Piernas: {{ $areas['legs']['count'] }} registros</title></path>
                        <path class="health-region health-region--knees" style="--health-heat: {{ $heat('knees') }}" d="M123 474 L164 474 L164 516 L123 516ZM196 474 L237 474 L237 516 L196 516Z"><title>Rodillas: {{ $areas['knees']['count'] }} registros</title></path>
                        <path class="health-region health-region--feet" style="--health-heat: {{ $heat('feet_ankles') }}" d="M122 515 L164 515 L164 560 Q143 575 112 563ZM196 515 L238 515 L248 563 Q217 575 196 560Z"><title>Pies y tobillos: {{ $areas['feet_ankles']['count'] }} registros</title></path>
                    </g>
                </svg>
            </div>
            <p class="health-body-map-note mb-0"><i class="bi bi-info-circle"></i> Espalda, piel y síntomas de todo el cuerpo se muestran en el resumen porque no corresponden a una sola zona frontal.</p>
        </div>

        <aside class="md-card-outlined health-area-summary">
            <div class="health-area-summary__header"><div><span class="health-type-chip">Detalle</span><h2 class="md-title-large mb-0">Zonas registradas</h2></div><span class="health-area-summary__badge">{{ $areas->filter(fn ($item) => $item['count'] > 0)->count() }}</span></div>
            <div class="health-area-list">
                @forelse($areas->filter(fn ($item) => $item['count'] > 0)->sortByDesc('severity') as $key => $stat)
                    <div class="health-area-row"><div class="health-area-row__name"><span style="--health-heat: {{ $stat['severity'] / $maximumSeverity }}"></span><strong>{{ \App\Models\HealthEvent::bodyAreaLabel($key) }}</strong></div><div><b>{{ $stat['count'] }}</b><small>{{ $stat['count'] === 1 ? 'registro' : 'registros' }}</small></div></div>
                @empty
                    <div class="health-body-empty"><i class="bi bi-person-standing"></i><p>Aún no hay síntomas con zona corporal para este período.</p><a href="{{ route('health') }}" class="md-btn-text">Registrar síntoma</a></div>
                @endforelse
            </div>
        </aside>
    </section>
</x-module-shell>
