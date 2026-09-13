{{-- Secciones del detalle de una persona. Fechas, experiencias y tareas viven dentro de Inicio. --}}
<x-module-tabs label="Secciones de la relación" :tabs="[
    ['label' => 'Inicio', 'route' => 'relationships.show', 'params' => ['relationship' => $relationship->id], 'icon' => 'bi-house', 'active' => ['relationships.show']],
    ['label' => 'Planes', 'route' => 'relationships.plans', 'params' => ['relationship' => $relationship->id], 'icon' => 'bi-map', 'active' => ['relationships.plans']],
]" />
