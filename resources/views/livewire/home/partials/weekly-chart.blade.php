@php($chartVersion = md5(json_encode($weeklyTrend)))
<div class="md-card-elevated h-100">
    <h2 class="md-title-small mb-1" style="color: var(--md-sys-color-on-surface);">
        <i class="bi bi-graph-up" style="color: var(--md-sys-color-primary);"></i> Tendencia semanal
    </h2>
    <p class="md-label-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">Hidratación y hábitos de los últimos 7 días (%)</p>
    <div wire:ignore
         wire:key="dashboard-chart-{{ $chartVersion }}"
         data-dashboard-chart='@json($weeklyTrend)'
         aria-label="Tendencia semanal de hidratación y hábitos"></div>
</div>
