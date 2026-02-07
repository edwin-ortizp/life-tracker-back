# Instrucciones para Agentes IA

Este proyecto es **Life Tracker**, una aplicación web integral para el seguimiento y mejora de la productividad personal. El proyecto está construido con **React**, **Vite**, **TypeScript** y **Firebase** como backend.

## Arquitectura del Proyecto

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS + Radix UI
- **Backend**: Firebase (Firestore)
- **Estado**: React Hooks + Custom Hooks
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **PWA**: Vite PWA Plugin

### Estructura de Carpetas

```
src/
├── features/              # Módulos principales (Feature-First Architecture)
│   ├── exercise/         # Seguimiento de ejercicios y actividad física
│   ├── habit/            # Seguimiento de hábitos positivos
│   ├── journal/          # Diario personal con Markdown
│   ├── meal/             # Plan de comidas semanal
│   ├── mood/             # Estado de ánimo y energía
│   ├── negative-habits/  # Seguimiento de hábitos a evitar
│   ├── pomodoro/         # Temporizador de productividad
│   ├── prepared-meals/   # Comidas preparadas
│   ├── recipe/           # Recetario
│   ├── shopping-list/    # Lista de compras con vista Kanban
│   ├── statistics/       # Estadísticas y análisis
│   ├── task/             # Gestión de tareas con matriz de Eisenhower
│   └── water/            # Seguimiento de hidratación
├── components/
│   ├── ui/               # Componentes reutilizables (Radix UI)
│   └── navigation/       # Sistema de navegación adaptable
├── utils/                # Utilidades globales
├── hooks/                # Hooks globales
├── config/               # Configuración (AI, Firebase)
└── pages/                # Páginas principales
```

## Módulos Principales

### 1. **Hábitos** (`/features/habit/`)
- Seguimiento diario y semanal de hábitos positivos
- Agrupación por momento del día (mañana, tarde, noche)
- Visualización de progreso y estadísticas

### 2. **Tareas** (`/features/task/`)
- Sistema de gestión con matriz de Eisenhower (Do, Decide, Delegate, Delete)
- Tareas recurrentes y privadas
- Vista calendario semanal
- Importación/exportación JSON
- Integración con IA para sugerencias

### 3. **Pomodoro** (`/features/pomodoro/`)
- Temporizador configurable (trabajo/descanso)
- Notificaciones del sistema
- Historial de sesiones
- Estadísticas de productividad

### 4. **Comidas** (`/features/meal/`)
- Planificación semanal de comidas
- 5 tipos: Desayuno, Media Mañana, Almuerzo, Merienda, Cena
- Exportación de ingredientes
- Integración con lista de compras y recetas

### 5. **Estado de Ánimo** (`/features/mood/`)
- Registro de estado de ánimo y energía
- Escala de 1-5 con comentarios
- Historial con edición de entradas

### 6. **Ejercicio** (`/features/exercise/`)
- 50+ tipos de ejercicios categorizados
- Cálculo de calorías y pasos
- Estadísticas y gráficos
- Resumen semanal/mensual

### 7. **Hidratación** (`/features/water/`)
- Seguimiento de ingesta de líquidos
- 15+ tipos de bebidas
- Panel de cantidades rápidas
- Estadísticas diarias

### 8. **Diario** (`/features/journal/`)
- Entradas con Markdown
- Lectura de archivos locales
- Exportación semanal
- Análisis de contenido

### 9. **Hábitos Negativos** (`/features/negative-habits/`)
- Seguimiento de hábitos a evitar
- Categorización por áreas (salud, productividad, etc.)
- Vista semanal y anual

### 10. **Lista de Compras** (`/features/shopping-list/`)
- Vista Kanban (Pendiente, Comprado, Descartado)
- Integración con plan de comidas
- Persistencia en Firestore

## Patrones de Desarrollo

### Arquitectura Feature-First
```
features/[module]/
├── components/          # Componentes específicos del módulo
├── hooks/              # Custom hooks para lógica de negocio
├── types/              # Interfaces y tipos TypeScript
├── utils/              # Utilidades específicas del módulo
└── readme.md           # Documentación del módulo
```

### Manejo de Estado
- **Custom Hooks**: Lógica de negocio encapsulada
- **Firebase Hooks**: Sincronización automática con Firestore
- **Estado Local**: React hooks para UI state

### Estilos y UI
- **Tailwind CSS**: Sistema de utilidades
- **Radix UI**: Componentes accesibles
- **Responsive Design**: Mobile-first approach
- **PWA**: Capacidades de aplicación nativa

### Manejo de Fechas
- Formato ISO (YYYY-MM-DD) para consistencia
- Utilidades centralizadas en `utils/dates.ts`
- Consideración de zonas horarias

## Configuración y Variables

### Variables de Entorno
```
VITE_GEMINI_API_KEY=tu_clave_api
```

### Configuración IA
- Archivo: `src/config/ai.ts`
- Modelos configurables por módulo
- Parámetros personalizables (temperature, top_p)

## Comandos de Desarrollo

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run build:mac    # Build + deploy para macOS
npm run build:win    # Build + deploy para Windows
npm run deploy:mac   # Deploy en macOS desde post-build-mac.js
npm run deploy:win   # Deploy en Windows desde post-build-windows.js
npm run lint         # Análisis de código
npm run preview      # Preview del build
```

### Flujos de Build y Deploy Local
- `build:mac`: genera `dist` y copia archivos a `/Applications/XAMPP/xamppfiles/htdocs/life-tracker`.
- `build:win`: ejecuta build y script de deploy para copiar archivos a `C:\laragon\www\life-tracker`.
- `deploy:mac` / `deploy:win`: ejecutan solo el script de copia/deploy del sistema operativo.
- TODO: validar y unificar el flujo de `build:win`, ya que el script de Windows también dispara `npm run build` internamente.

## Consideraciones Importantes

### Rendimiento
- Lazy loading de componentes
- Chunk splitting optimizado
- Imágenes optimizadas para PWA

### Accesibilidad
- Componentes Radix UI
- Navegación por teclado
- Contraste adecuado

### Responsividad
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Navegación adaptable (desktop sidebar, mobile bottom)
- Optimización para touch en móviles

### Seguridad
- Reglas de Firestore configuradas
- Autenticación Firebase
- Sanitización de contenido Markdown

## Flujo de Desarrollo

1. **Nuevas características**: Crear en `/features/[module]/`
2. **Componentes reutilizables**: Agregar a `/components/ui/`
3. **Utilidades globales**: Colocar en `/utils/`
4. **Tipos compartidos**: Definir en archivos `types/`
5. **Hooks globales**: Ubicar en `/hooks/`

## Contribución

- Seguir arquitectura Feature-First
- Mantener componentes pequeños y enfocados
- Usar TypeScript para tipado estricto
- Documentar nuevos módulos con README
- Pruebas en diferentes dispositivos y navegadores

---

*Última actualización: Junio 2025*
