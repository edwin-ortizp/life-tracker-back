# Life Tracker

Una aplicación integral para el seguimiento y mejora de la productividad personal, que incluye múltiples módulos para gestionar diferentes aspectos de la vida diaria.

## Estructura del Proyecto

```
src/
├── features/
│   ├── habit/               # Módulo de seguimiento de hábitos
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── pomodoro/           # Módulo de temporizador pomodoro
│   ├── tasks/              # Módulo de seguimiento de tareas
│   ├── journal/            # Módulo de diario personal
│   └── shared/             # Componentes y utilidades compartidas
├── components/
│   └── ui/                 # Componentes UI reutilizables
├── utils/                  # Utilidades globales
└── hooks/                  # Hooks globales
```

## Arquitectura

### Características principales

1. **Estructura Feature-First**: 
   - La aplicación está organizada en módulos independientes
   - Cada módulo representa una funcionalidad específica (hábitos, pomodoro, tareas, etc.)
   - Los módulos son independientes pero pueden compartir componentes y utilidades comunes

2. **Componentes**:
   - Componentes reutilizables globales en `/components/ui`
   - Componentes específicos de cada módulo en `/features/[module]/components`
   - Componentes compartidos entre módulos en `/features/shared`

3. **Estado y Datos**:
   - Firebase como backend
   - Custom hooks para la lógica de negocio
   - Estado local con React hooks donde sea apropiado

### Módulos Principales

1. **Hábitos**:
   - Seguimiento diario y semanal de hábitos
   - Visualización de progreso
   - Agrupación por momento del día

2. **Pomodoro**:
   - Temporizador configurable
   - Seguimiento de sesiones
   - Estadísticas de productividad

3. **Tareas**:
   - Gestión de tareas y proyectos
   - Priorización y categorización
   - Vista de calendario

4. **Diario**:
   - Entradas diarias
   - Etiquetado y búsqueda
   - Análisis de estado de ánimo
   - Lectura de archivos Markdown locales en `src/features/journal/markdown`
   - Exportación semanal a Markdown mediante `ExportWeekButton`

### Patrones y Convenciones

1. **Manejo de Fechas**:
   - Todas las fechas se manejan en formato ISO (YYYY-MM-DD)
   - Funciones utilitarias centralizadas para manipulación de fechas (utils/dates.ts)
   - Consideración de zonas horarias en el formato de visualización

2. **Estilos**:
   - Tailwind CSS para estilos
   - Sistema de colores consistente
   - Diseño responsive con clases utilitarias

3. **Organización de Componentes**:
   - Un componente por archivo
   - Nombres descriptivos y consistentes
   - Props tipadas con TypeScript
   - Uso de interfaces para definir tipos

## Contribución

Al contribuir a este proyecto, por favor considera:

1. **Estructura de Archivos**:
   - Mantén los nuevos componentes dentro de su módulo correspondiente
   - Sigue la estructura de carpetas existente
   - Crea nuevos módulos en `/features` si es necesario

2. **Convenciones de Código**:
   - Usa TypeScript para todos los archivos nuevos
   - Mantén los componentes pequeños y enfocados
   - Documenta los props y tipos importantes

3. **Patrones de Estado**:
   - Usa custom hooks para lógica compleja
   - Mantén el estado lo más cerca posible de donde se usa
   - Sigue los patrones existentes para interacciones con Firebase

## Recomendaciones de Desarrollo

1. **Rendimiento**:
   - Optimiza el manejo de datos para evitar re-renders innecesarios
   - Implementa estrategias de carga diferida cuando sea apropiado
   - Utiliza herramientas de desarrollo de React para identificar cuellos de botella

2. **Mantenibilidad**:
   - Mantén la lógica de negocio separada de los componentes UI
   - Usa constantes para valores reutilizables
   - Sigue los patrones existentes para nuevas características

3. **Experiencia de Usuario**:
   - Implementa estados de carga apropiados
   - Maneja errores de manera consistente
   - Mantén la interfaz responsive y accesible

## Stack Tecnológico

- React
- TypeScript
- Firebase (Firestore)
- Tailwind CSS
- Lucide para iconos
- Recharts para visualizaciones