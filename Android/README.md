# Life Tracker Android (MVP)

MVP Android app for the Life Tracker project using **Kotlin**, **Jetpack Compose (Material 3)**, and **Supabase** for auth + data (tasks table).

## Requisitos
- Android Studio Ladybug o superior
- JDK 17
- Android SDK 34 (compileSdk 34, minSdk 26)

## Configuración de Supabase (sin exponer secretos)
1. En `Android/local.properties` agrega tus credenciales (el archivo ya está en `.gitignore`):
   ```properties
   SUPABASE_URL=https://<tu-instancia>.supabase.co
   SUPABASE_ANON_KEY=<tu_anon_key>
   ```
2. Alternativamente, puedes exportar las variables de entorno antes de compilar:
   ```bash
   export SUPABASE_URL=https://<tu-instancia>.supabase.co
   export SUPABASE_ANON_KEY=<tu_anon_key>
   ```

## Cómo correr el proyecto
```bash
cd Android
./scripts/fetch-gradle-wrapper.sh  # descarga gradle-wrapper.jar (sin commitear binarios)
./gradlew :app:assembleDebug      # o usa el run configuration de Android Studio
```
Luego instala el APK generado en `app/build/outputs/apk/debug/` en un emulador o dispositivo.

### Si no puedes descargar binarios (wrapper)
Usa una instalación local de Gradle 8.7+ en lugar del wrapper:
```bash
cd Android
gradle --version   # asegúrate de que sea 8.7 o superior
gradle :app:assembleDebug
```

## Arquitectura y paquetes
- `com.lifetracker.android.data`
  - `SupabaseApi`: cliente Ktor contra Supabase (auth + REST tasks)
  - `SupabaseRepository`: orquesta login, lectura de tareas y logout
  - `TokenStorage`: persiste `access_token`/`refresh_token` en DataStore
  - Modelos `AuthResponse`, `Task`, `AuthTokens`
- `ui.auth`: pantalla de Login + `AuthViewModel`
- `ui.tasks`: Task list + detalle, `TaskListViewModel`, `TaskDetailViewModel`
- `ui.navigation`: NavHost Compose con rutas `login`, `tasks`, `task/{taskId}`
- `ui.theme`: configuración básica de Material 3
- `MainActivity`/`MainViewModel`: bootstrap de dependencias y sesión (autologin si hay token guardado)

## Flujo del MVP
1. **Login** con email/password → llamada a `auth/v1/token?grant_type=password`.
2. Tokens se guardan en DataStore → la app navega a lista de tareas.
3. **Task List** lee `tasks` vía REST (`/rest/v1/tasks?select=*&order=date.desc`). Estados: loading/empty/error.
4. Al tocar una tarea → **Task Detail** muestra título, fecha, estado y descripción.
5. Logout limpia tokens y regresa a Login.

## Notas
- La app reutiliza `SUPABASE_URL` y `SUPABASE_ANON_KEY`; no se exponen valores en el repo.
- Si `date` no existe en tu tabla, ajusta el campo de ordenamiento en `SupabaseApi#getTasks`.
- Para evitar binarios en el repositorio, `gradle/wrapper/gradle-wrapper.jar` está ignorado; usa `./scripts/fetch-gradle-wrapper.sh` antes de ejecutar `./gradlew`.
