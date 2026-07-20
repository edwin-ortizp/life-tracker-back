<?php

return [
    'navigation' => [
        'overview' => ['label' => 'Vista general', 'icon' => 'bi-grid-1x2', 'items' => [
            ['label' => 'Mi día', 'route' => 'home', 'icon' => 'bi-sunrise', 'active' => ['home']],
            ['label' => 'Estadísticas', 'route' => 'statistics', 'icon' => 'bi-bar-chart', 'active' => ['statistics*']],
            ['label' => 'Ajustes', 'route' => 'settings', 'icon' => 'bi-gear', 'active' => ['settings*']],
        ]],
        'wellbeing' => ['label' => 'Bienestar', 'icon' => 'bi-heart-pulse', 'items' => [
            ['label' => 'Hábitos', 'route' => 'habits', 'icon' => 'bi-check2-square', 'active' => ['habits*']],
            ['label' => 'Hidratación', 'route' => 'water.daily', 'icon' => 'bi-droplet', 'active' => ['water*']],
            ['label' => 'Ejercicio', 'route' => 'exercise', 'icon' => 'bi-activity', 'active' => ['exercise*']],
            ['label' => 'Salud', 'route' => 'health', 'icon' => 'bi-heart-pulse', 'active' => ['health*']],
            ['label' => 'Ánimo y energía', 'route' => 'mood', 'icon' => 'bi-emoji-smile', 'active' => ['mood*']],
            ['label' => 'Hábitos a evitar', 'route' => 'negative-habits', 'icon' => 'bi-shield-check', 'active' => ['negative-habits*']],
        ]],
        'productivity' => ['label' => 'Productividad', 'icon' => 'bi-calendar-check', 'items' => [
            ['label' => 'Tareas', 'route' => 'tasks.list', 'icon' => 'bi-list-task', 'active' => ['tasks*']],
            ['label' => 'Pomodoro', 'route' => 'pomodoro', 'icon' => 'bi-stopwatch', 'active' => ['pomodoro*']],
            ['label' => 'Objetivos', 'route' => 'goals', 'icon' => 'bi-flag', 'active' => ['goals*']],
        ]],
        'food' => ['label' => 'Alimentación', 'icon' => 'bi-egg-fried', 'items' => [
            ['label' => 'Comidas', 'route' => 'meals.weekly', 'icon' => 'bi-egg-fried', 'active' => ['meals*']],
        ]],
        'life' => ['label' => 'Vida personal', 'icon' => 'bi-person-heart', 'items' => [
            ['label' => 'Diario', 'route' => 'journal', 'icon' => 'bi-journal-text', 'active' => ['journal*']],
            ['label' => 'Relaciones', 'route' => 'relationships', 'icon' => 'bi-people', 'active' => ['relationships*']],
        ]],
        'vehicles' => ['label' => 'Vehículos', 'icon' => 'bi-car-front', 'items' => [
            ['label' => 'Vehículos', 'route' => 'vehicles', 'icon' => 'bi-car-front', 'active' => ['vehicles*']],
        ]],
    ],
    'home' => [
        'title' => 'Mi día',
        'subtitle' => 'Una vista coordinada de lo que importa hoy.',
        'icon' => 'bi-sunrise',
        'patterns' => ['home'],
        'preserve' => ['date'],
    ],
    'water' => [
        'title' => 'Hidratación',
        'subtitle' => 'Registra tu consumo y observa el ritmo de cumplimiento.',
        'icon' => 'bi-droplet',
        'patterns' => ['water*'],
        'preserve' => ['date', 'period'],
        'tabs' => [
            ['label' => 'Registro diario', 'route' => 'water.daily', 'icon' => 'bi-droplet-half', 'active' => ['water.daily']],
            ['label' => 'Calendario', 'route' => 'water.calendar', 'icon' => 'bi-calendar3', 'active' => ['water.calendar']],
            ['label' => 'Semanal', 'route' => 'water.weekly', 'icon' => 'bi-bar-chart-line', 'active' => ['water.weekly']],
            ['label' => 'Rango', 'route' => 'water.range', 'icon' => 'bi-graph-up', 'active' => ['water.range']],
            ['label' => 'Ajustes', 'route' => 'water.settings', 'icon' => 'bi-sliders', 'active' => ['water.settings']],
        ],
    ],
    'exercise' => [
        'title' => 'Ejercicio', 'subtitle' => 'Actividad, esfuerzo y progreso físico.', 'icon' => 'bi-activity',
        'patterns' => ['exercise*'], 'preserve' => ['date'],
    ],
    'health' => [
        'title' => 'Salud', 'subtitle' => 'Historial, síntomas y seguimiento corporal.', 'icon' => 'bi-heart-pulse',
        'patterns' => ['health*'], 'preserve' => ['period', 'type'],
        'tabs' => [
            ['label' => 'Registro', 'route' => 'health', 'icon' => 'bi-clock-history', 'active' => ['health']],
            ['label' => 'Vista del cuerpo', 'route' => 'health.body', 'icon' => 'bi-person-standing', 'active' => ['health.body']],
        ],
    ],
    'vehicles' => [
        'title' => 'Vehículos', 'subtitle' => 'Mantenimiento, consumo y próximos cuidados.', 'icon' => 'bi-car-front',
        'patterns' => ['vehicles*'], 'preserve' => [],
    ],
    'habits' => [
        'title' => 'Hábitos', 'subtitle' => 'Constancia diaria y perspectiva semanal.', 'icon' => 'bi-check2-square',
        'patterns' => ['habits*'], 'preserve' => ['date'],
        'tabs' => [
            ['label' => 'Registro diario', 'route' => 'habits', 'icon' => 'bi-check2-square', 'active' => ['habits']],
            ['label' => 'Resumen semanal', 'route' => 'habits.weekly', 'icon' => 'bi-bar-chart-line', 'active' => ['habits.weekly']],
        ],
    ],
    'mood' => [
        'title' => 'Ánimo y energía', 'subtitle' => 'Registra cómo te sientes y con cuánta energía cuentas.', 'icon' => 'bi-emoji-smile',
        'patterns' => ['mood*'], 'preserve' => ['date'],
    ],
    'journal' => [
        'title' => 'Diario', 'subtitle' => 'Pensamientos, emociones y perspectiva en un mismo lugar.', 'icon' => 'bi-journal-text',
        'patterns' => ['journal*'], 'preserve' => ['date', 'week'],
        'tabs' => [
            ['label' => 'Entradas', 'route' => 'journal', 'icon' => 'bi-journal-text', 'active' => ['journal']],
            ['label' => 'Vida', 'route' => 'journal.life', 'icon' => 'bi-grid-3x3-gap', 'active' => ['journal.life']],
            ['label' => 'Semana', 'route' => 'journal.life.week', 'icon' => 'bi-calendar-week', 'active' => ['journal.life.week']],
        ],
    ],
    'pomodoro' => [
        'title' => 'Pomodoro', 'subtitle' => 'Tiempo de enfoque, pausas y constancia.', 'icon' => 'bi-stopwatch',
        'patterns' => ['pomodoro*'], 'preserve' => ['date'],
        'tabs' => [
            ['label' => 'Temporizador', 'route' => 'pomodoro', 'icon' => 'bi-stopwatch', 'active' => ['pomodoro']],
            ['label' => 'Ajustes', 'route' => 'pomodoro.settings', 'icon' => 'bi-sliders', 'active' => ['pomodoro.settings']],
        ],
    ],
    'meals' => [
        'title' => 'Comidas', 'subtitle' => 'Planifica la semana sin perder de vista el día.', 'icon' => 'bi-egg-fried',
        'patterns' => ['meals*'], 'preserve' => ['date'],
        'tabs' => [
            ['label' => 'Planificación', 'route' => 'meals.weekly', 'icon' => 'bi-calendar-week', 'active' => ['meals.weekly']],
            ['label' => 'Recetas', 'route' => 'meals.recipes', 'icon' => 'bi-book', 'active' => ['meals.recipes']],
            ['label' => 'Ingredientes', 'route' => 'meals.ingredients', 'icon' => 'bi-basket', 'active' => ['meals.ingredients']],
            ['label' => 'Compras', 'route' => 'meals.shopping', 'icon' => 'bi-cart3', 'active' => ['meals.shopping']],
        ],
    ],
    'tasks' => [
        'title' => 'Tareas', 'subtitle' => 'Decide, ordena y completa el trabajo con claridad.', 'icon' => 'bi-list-check',
        'patterns' => ['tasks*'], 'preserve' => ['date', 'status', 'category'],
        'tabs' => [
            ['label' => 'Lista', 'route' => 'tasks.list', 'icon' => 'bi-list-task', 'active' => ['tasks.list']],
            ['label' => 'Gantt', 'route' => 'tasks.gantt', 'icon' => 'bi-bar-chart-steps', 'active' => ['tasks.gantt']],
            ['label' => 'Flujo', 'route' => 'tasks.flow', 'icon' => 'bi-signpost-split', 'active' => ['tasks.flow']],
            ['label' => 'Kanban', 'route' => 'tasks.kanban', 'icon' => 'bi-kanban', 'active' => ['tasks.kanban']],
            ['label' => 'Planificación', 'route' => 'tasks.planning', 'icon' => 'bi-calendar-week', 'active' => ['tasks.planning']],
            ['label' => 'Progreso', 'route' => 'tasks.progress', 'icon' => 'bi-trophy', 'active' => ['tasks.progress']],
        ],
    ],
    'relationships' => [
        'title' => 'Relaciones', 'subtitle' => 'Personas, círculos y momentos que quieres cuidar.', 'icon' => 'bi-people',
        'patterns' => ['relationships*'], 'preserve' => ['circle', 'status', 'archived'],
    ],
    'goals' => [
        'title' => 'Objetivos', 'subtitle' => 'Resultados, avances y próximos pasos.', 'icon' => 'bi-flag',
        'patterns' => ['goals*'], 'preserve' => ['status'],
    ],
    'statistics' => [
        'title' => 'Estadísticas', 'subtitle' => 'Patrones y tendencias de tu actividad.', 'icon' => 'bi-bar-chart',
        'patterns' => ['statistics*'], 'preserve' => ['days'],
    ],
    'negative-habits' => [
        'title' => 'Hábitos a evitar', 'subtitle' => 'Observa patrones sin perder de vista tu progreso.', 'icon' => 'bi-shield-check',
        'patterns' => ['negative-habits*'], 'preserve' => ['date'],
    ],
    'settings' => [
        'title' => 'Ajustes generales', 'subtitle' => 'Perfil, seguridad y preferencias que afectan toda la aplicación.', 'icon' => 'bi-gear',
        'patterns' => ['settings*'], 'preserve' => [],
    ],
];
