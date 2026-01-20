# Life Tracker Android (Jetpack Compose MVP)

Implementación nativa con **Jetpack Compose** y **Material 3** para listar tareas de manera de solo lectura. Usa datos de ejemplo locales (`SampleTasks`) para el MVP; el módulo está preparado para conectar con un backend (p.ej. Supabase) en una iteración posterior.

## Estructura
```
Android/
├── settings.gradle.kts
├── build.gradle.kts
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/com/lifetracker/tasks/
        │   ├── MainActivity.kt
        │   ├── Task.kt
        │   ├── data/SampleTasks.kt
        │   └── ui/
        │       ├── TaskListScreen.kt
        │       └── theme/...
        └── res/values/
            ├── strings.xml
            └── themes.xml
```

## Cómo ejecutar
1. Abre `Android/` con **Android Studio Iguana o más reciente**.
2. Sincroniza el proyecto (Gradle 8.3.2, Kotlin 1.9.23, Compose BOM 2024.06).
3. Ejecuta la app en un emulador o dispositivo Android (mínimo API 24).

## Notas del MVP
- UI 100% nativa: **Jetpack Compose + Material 3**.
- Lista de tareas con badges de prioridad, fecha de creación, fecha de vencimiento y estado (pendiente/completada).
- Datos locales en `SampleTasks`; reemplázalos por tu fuente real cuando conectes Supabase.
