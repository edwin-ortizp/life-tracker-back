# Gap analysis: preparación de LifeTracker para usuarios reales

## Contexto
LifeTracker se construyó para un único usuario (el dueño). Antes de abrir el registro a personas que no conocen el sistema hay que saber qué falta, con base en el código real. El análisis se hizo leyendo el repo (rutas, controladores de auth, modelos, migraciones, Livewire, middleware, `public/sw.js`, workflows, config). **No se implementa nada todavía**: el entregable es este diagnóstico, en `docs/user-readiness-gap-analysis.md`.

## Resumen ejecutivo
- **Lo bueno (ya listo):** aislamiento de datos sólido en la base. Todas las tablas de usuario tienen `user_id` NOT NULL indexado con FK; los hijos usan FK compuesta `[parent_id, user_id]`; unicidad de catálogos incluye `user_id`; middlewares de API/MCP/CalDAV hacen `Auth::setUser`; `withoutGlobalScopes` siempre re-filtra por usuario; no hay `User::first()` ni ids fijos en `app/`; migraciones de backfill recorren todos los usuarios; el registro ya siembra catálogos por defecto (hábitos, ejercicio, bebidas, ánimo, categorías de tareas y gastos, círculos). Tokens de integración hasheados (SHA-256), rotables y revocables desde Ajustes. No hay caché, jobs, notificaciones ni scheduler que puedan cruzar datos (porque no existen).
- **Lo que bloquea:** acceso (sin throttling de login/registro, sin recuperación de contraseña, sin verificación de correo, registro abierto sin control), service worker que conserva páginas autenticadas tras logout, workflow `deploy.yml` heredado que publica una API key de Gemini, scope de tenancy que *falla abierto* sin usuario, ausencia de backups, defaults de producción inseguros, sin eliminación de cuenta / privacidad.
- **Lo que falta para MVP:** onboarding mínimo, páginas de error, zona horaria por usuario, estados vacíos en módulos clave, pivotes de Planes sin `user_id`, monitoreo de errores, correo real.

## Matriz consolidada de gaps

Leyenda prioridad: **B** = Bloqueante · **MVP** = Necesario para MVP · **E** = Puede esperar · **F** = Futuro.

### 1. Registro y acceso
| ID | Gap | Situación actual | Esperado | Riesgo | Tipo | Prio | Acción propuesta | Archivos |
|---|---|---|---|---|---|---|---|---|
| A1 | Sin rate limiting en login/registro | `/login` y `/register` POST solo bajo `guest`; ningún `RateLimiter` | Throttle por email+IP en login, por IP en registro | Fuerza bruta de contraseñas, registro masivo de bots | Seguridad | B | `RateLimiter::for('login')` en `AppServiceProvider` + `throttle:` en rutas | `routes/web.php:65-69`, `LoginController.php:23` |
| A2 | Sin recuperación de contraseña | Tabla `password_reset_tokens` existe, sin rutas/vistas; mail = `log` | Flujo "Olvidé mi contraseña" por correo | Usuario bloqueado permanentemente; soporte manual en BD | Funcional | B | Rutas + controlador `Password::sendResetLink/reset`, vistas, depende de E1 | `auth/login.blade.php`, `config/mail.php` |
| A3 | Registro abierto sin control | Cualquiera puede registrarse, sin flag ni invitación | Registro controlable (flag `REGISTRATION_ENABLED` y/o código de invitación) para una beta cerrada | Abuso, crecimiento no controlado durante piloto | Seguridad/Funcional | B | Flag env + middleware; opcional lista de invitaciones | `RegisterController.php`, `routes/web.php` |
| A4 | Sin verificación de correo | `User` no implementa `MustVerifyEmail` | Verificar email antes de uso pleno (necesario para que el reset funcione con correos reales) | Cuentas con correos ajenos/typos; reset a terceros | Seguridad | MVP | `MustVerifyEmail` + middleware `verified` + vistas | `app/Models/User.php:11` |
| A5 | Política de contraseña débil | min 8, sin `Password::defaults()`; cambio de contraseña con reglas inline | Regla centralizada (min 8 + uncompromised) usada en registro, reset y cambio | Contraseñas triviales | Seguridad | MVP | `Password::defaults()` en provider | `RegisterController.php:65-69`, `SettingsPage.php:86-114` |
| A6 | Cambio de contraseña no cierra otras sesiones | No llama `logoutOtherDevices` | Invalidar otras sesiones al cambiar contraseña | Sesión robada sigue activa | Seguridad | MVP | `Auth::logoutOtherDevices()` | `SettingsPage.php:86-114` |
| A7 | Sin eliminación/desactivación de cuenta ni exportación | No existe | Usuario puede eliminar su cuenta (con confirmación) y exportar sus datos | Incumplimiento de protección de datos (Ley 1581 Colombia / GDPR); solicitudes manuales | Funcional/Legal | B (eliminar) / E (exportar) | Acción en Ajustes que borre en cascada (FKs ya lo permiten), revoque tokens OAuth/integración y archivos de vehículos | `SettingsPage`, `storage/app/public/vehicles/{id}` |
| A8 | Email no modificable | Campo deshabilitado "El email no puede modificarse" | Cambio de email con re-verificación | Usuario atascado con correo viejo; soporte manual | Funcional | E | Flujo de cambio con verificación | `settings-page.blade.php:15-16` |
| A9 | Cookies de sesión | `SESSION_SECURE_COOKIE` sin default, `encrypt=false`, lifetime 120 | `secure=true` en prod, documentado | Cookie por HTTP | Seguridad | MVP | Default seguro en `.env.production.example` | `config/session.php:50,172` |

### 2. Primer ingreso y onboarding
| ID | Gap | Situación | Esperado | Riesgo | Tipo | Prio | Acción | Archivos |
|---|---|---|---|---|---|---|---|---|
| O1 | Sin onboarding | Tras registro → redirect a `home` directo; no hay welcome/tour/first-run | Pantalla de bienvenida corta: qué es LifeTracker, elegir módulos de interés, datos básicos (nombre, fecha nacimiento, zona horaria, meta de agua) | Usuario ve 15+ módulos sin contexto y abandona | UX | MVP | Flag `onboarded_at` en users + wizard Livewire de 2-3 pasos | `RegisterController.php:79-81`, `Dashboard.php` |
| O2 | Dashboard sin guía para cuenta vacía | Widgets con `@forelse/@empty` aislados; calendario de vida devuelve null sin fecha de nacimiento; metas caen a defaults silenciosos (agua 2500, ejercicio 30) | Bloque "Primeros pasos" con acciones sugeridas (crear primera tarea, registrar agua, completar perfil) mientras falten datos | Dashboard vacío sin acción clara | UX | MVP | Checklist de primeros pasos en dashboard, ocultable | `home/partials/*`, `LifeCalendar.php:13`, `WaterGoal.php:9`, `ExerciseProgress.php:11` |
| O3 | Sin landing pública | `/` exige auth → redirige a login | Página pública mínima que explique el producto con CTA registrarse | Nadie entiende qué es antes de registrarse | UX | E (MVP si se hace adquisición abierta) | Vista pública simple | `routes/web.php:87` |
| O4 | Descripción de módulos | Navegación por `config/modules.php`, sin texto explicativo por módulo | Una línea "para qué sirve" por módulo visible en estados vacíos / menú | Módulos incomprensibles (Flow, Gantt, Life calendar, NegativeHabit) | UX | MVP | Añadir `description` en `config/modules.php` y mostrarla | `config/modules.php` |

### 3. Perfil, preferencias y configuración
| ID | Gap | Situación | Esperado | Riesgo | Tipo | Prio | Acción | Archivos |
|---|---|---|---|---|---|---|---|---|
| P1 | Zona horaria global fija | `config/app.php:70` `America/Bogota`; no hay columna timezone | `users.timezone` aplicada por request (middleware) a "hoy", rachas, logs diarios | Usuario fuera de Colombia: registros en día equivocado, rachas rotas | Funcional/Datos | MVP (B si se aceptan usuarios fuera de UTC-5) | Columna + middleware `date_default_timezone_set`/Carbon por usuario; capturar en onboarding | `config/app.php:70` |
| P2 | Locale inconsistente | `APP_LOCALE` default `en` mientras UI es 100% español; `->locale('es')` hardcodeado en varios sitios; `number_format(',', '.')` | Declarar app solo-español para MVP (`APP_LOCALE=es`, mensajes de validación en es) | Mensajes de validación/errores en inglés mezclados | UX | MVP | Fijar `es` + publicar `lang/es` de validación | `config/app.php:83`, `Plan.php:172`, `TaskGantt.php:170`, `vehicle-show.blade.php` |
| P3 | Preferencias de módulos | No hay activar/ocultar módulos; `module_settings` solo usado por pomodoro y hábitos | Usuario oculta módulos que no usa (nav más simple) | Sobrecarga cognitiva | UX | E | Preferencia de módulos visibles en `module_settings` | `config/modules.php`, `ModuleSetting` |
| P4 | Meta de ejercicio no editable en Ajustes generales | `daily_exercise_minutes` fillable; verificar que `ExerciseSettings` lo expone | Todas las metas personales editables desde UI | Meta implícita de 30 min | Funcional | E | Confirmar/agregar | `ExerciseSettings.php`, `ExerciseProgress.php:11` |
| P5 | Bebidas no restaurables | Drink types sembrados inline en `RegisterController` sin opción de restaurar (otros catálogos sí) | Mover a `DefaultDrinkTypes` + restaurar desde Ajustes de agua | Usuario que borra "Agua" queda sin poder registrar | Datos/UX | MVP | Extraer a `app/Support/DefaultDrinkTypes.php` como los demás | `RegisterController.php:90-105` |
| P6 | Integraciones visibles para todos | Ajustes muestra Obsidian/n8n, CalDAV y token IA a cualquier usuario | Sección "Avanzado/Integraciones" con explicación, o ocultas en MVP | Confusión; tokens creados sin entender riesgo | UX/Seguridad | MVP | Agrupar como avanzado con copy explicativo | `SettingsPage.php:116-216` |
| P7 | Moneda/unidades | Sin campo de moneda; formato numérico es-CO fijo; unidad de uso por vehículo sí existe | Aceptable para MVP en Colombia | Bajo | Otro | F | — | `vehicle-*` |

### 4. Multitenancy y aislamiento
Hallazgo global: **no se encontró fuga confirmada entre usuarios.** Riesgos son de diseño/defensa en profundidad.
| ID | Gap | Situación | Esperado | Riesgo | Tipo | Prio | Acción | Archivos |
|---|---|---|---|---|---|---|---|---|
| M1 | Global scope falla abierto | `BelongsToUser` solo filtra `if (auth()->check())`; sin usuario devuelve todo | Sin usuario: excepción o resultado vacío; bypass explícito (`withoutGlobalScope('user')`) en seeders/migraciones | El primer job/command/scheduler futuro (recordatorios, correos) verá datos de todos | Multitenancy | B | Cambiar a fail-closed + test; revisar consola/migraciones que dependan del comportamiento | `app/Models/Traits/BelongsToUser.php` |
| M2 | Pivotes de Planes sin `user_id` | `plan_relationship`, `circle_plan`, `plan_visit_relationship`, `plan_links`, `plan_images` con FK solo al padre | `user_id` + FK compuesta como el resto del esquema | La BD aceptaría vincular plan de A con contacto de B si un cambio futuro omite el filtro | Multitenancy/Datos | MVP | Migración que agregue `user_id` + FK compuestas (backfill desde plan) | `2026_09_14_000001_create_plans_tables.php:30-64`, `..._000003` |
| M3 | `shopping_item_variants` FK simple | Tiene `user_id` pero FK solo `shopping_item_id` | FK compuesta | Inconsistencia | Datos | E | Migración | `2026_07_19_000001:13-14` |
| M4 | Sin Policies ni Gates | No existe `app/Policies`; aislamiento 100% por scope; solo 2 propiedades `#[Locked]` | Ids de componentes `#[Locked]`; policies para modelos raíz (Vehicle, Plan, Relationship, Goal, Task) | Hoy un id manipulado da 404 (bien), pero sin segunda barrera | Seguridad | MVP (`#[Locked]`) / E (policies) | `#[Locked]` en `planId`, `relationshipId`, `goalId`, `vehicleId`, etc. | `PlanShow.php`, `GoalDetail.php`, `ResolvesRelationship.php`, vehículos |
| M5 | Regla `exists` sin usuario | `exists:maintenance_templates,id` sin filtro (mitigado después) | `Rule::exists` filtrado por `user_id` o global | Enumeración de ids | Seguridad | E | Ajustar regla | `Vehicle/Concerns/ManagesMaintenance.php:71` |
| M6 | Tokens sin verificación de propósito | `AuthenticateIntegrationToken` acepta tokens obsidian/caldav/ai indistintamente; sin scopes ni expiración | Cada token solo sirve para su propósito | Contraseña CalDAV del teléfono da acceso total a API/MCP | Seguridad | MVP | Validar `purpose` por ruta | `AuthenticateIntegrationToken.php:17-31`, `AuthenticateMcpRequest.php:57-72` |
| M7 | Fotos de vehículos en disco público | `public` disk `vehicles/{user_id}/hash` | Disco privado servido por ruta autenticada (o aceptar riesgo: nombre aleatorio) | URL compartida = acceso | Seguridad | E | Ruta firmada/privada | `ManagesVehicleForm.php:119` |
| M8 | Sin tests de aislamiento sistemáticos | Existe `MultitenancySchemaTest` y ~26 tests que mencionan otro usuario; ninguno recorre todos los modelos | Test que para cada modelo con `BelongsToUser` verifique que usuario B no ve datos de A y que tablas de usuario tienen `user_id` | Regresiones silenciosas | Multitenancy | MVP | Test genérico parametrizado por modelo + rutas con id | `tests/Feature/MultitenancySchemaTest.php` |
| ✔ | Ya correcto | CalDAV por `tasks:{user_id}`, `CalDavChange` filtrado, observer usa `user_id` de la tarea, backfills por usuario, sin caché, `DatabaseSeeder` con email propio solo en dev | — | — | — | — | Mantener | `TaskCalendarBackend.php`, `TaskCalDavObserver.php` |

### 5. Seguridad
| ID | Gap | Situación | Esperado | Riesgo | Tipo | Prio | Acción | Archivos |
|---|---|---|---|---|---|---|---|---|
| S1 | Service worker conserva páginas autenticadas | `sw.js` cachea hasta 30 páginas GET y sirve `/` cacheado; nada limpia al hacer logout | Limpiar `PAGE_CACHE` en logout y no servir páginas de usuario sin sesión | Dispositivo compartido: siguiente persona ve diario/salud del anterior | Seguridad | B | `postMessage` de logout → `caches.delete`; header `Clear-Site-Data` en logout | `public/sw.js:61-76`, `resources/js/pwa.js`, `LoginController::logout` |
| S2 | Workflow heredado publica secretos | `.github/workflows/deploy.yml` inyecta `VITE_GEMINI_API_KEY` en build pública (GitHub Pages) en push y PR a main | Eliminar workflow; rotar la clave | Clave Gemini expuesta públicamente | Seguridad | B | Borrar workflow + rotar clave | `.github/workflows/deploy.yml:26-30` |
| S3 | Defaults de producción | `.env.example` con `APP_DEBUG=true`, `LOG_LEVEL=debug`; sin trusted proxies, HTTPS forzado, ni headers (HSTS, X-Frame-Options, CSP) | `.env.production.example` + middleware de headers + `URL::forceScheme('https')` | Stack traces con secretos expuestos; clickjacking | Seguridad/Infra | B (debug) / MVP (headers) | Documentar y aplicar | `.env.example`, `bootstrap/app.php` |
| S4 | `/dav` sin throttling | `laravelsabre.middleware = []`; respuesta temprana revela emails existentes | Throttle + respuesta uniforme | Enumeración de usuarios, carga | Seguridad | MVP | Middleware throttle | `config/laravelsabre.php`, `app/CalDav/AuthBackend.php:31` |
| S5 | Registro dinámico OAuth abierto | `Mcp::oauthRoutes()` con `throttle:20,1`, sin limpieza de clientes | Aceptable por diseño MCP; limpiar clientes huérfanos | Basura en `oauth_clients` | Seguridad | E | Comando de purga | `routes/ai.php:16` |
| S6 | URLs de imágenes de planes `http` | Se permiten URLs http externas | Solo https | Mixed content / tracking | Seguridad | E | Validación | `ManagesPlanDialogs.php:171`, `CreatePlanTool.php:76` |
| ✔ | Logs | Sin `Log::` con datos sensibles; `MeasurePerformance` solo local | — | — | — | — | — | — |

### 6. Experiencia por módulo (usuario nuevo)
| ID | Módulo | Situación | Gap | Prio |
|---|---|---|---|---|
| U1 | Hábitos negativos | 0 estados vacíos | Explicar qué es y CTA "Registrar primer hábito a evitar" | MVP |
| U2 | Estadísticas | 0 estados vacíos | Mensaje "aún no hay datos; registra X días" | MVP |
| U3 | Comidas | Requiere recetas antes de planificar; 2/6 vistas con estado vacío | Estado vacío que guíe "crea tu primera receta"; opcional recetas plantilla | MVP |
| U4 | Vehículos | Requiere crear vehículo → plantillas → planes | Estado vacío con secuencia; catálogo global de mantenimiento ya existe (✔) | MVP |
| U5 | Metas | Sin plantilla | Estado vacío con ejemplos de metas | E |
| U6 | Diario / Calendario de vida | Calendario requiere fecha de nacimiento + expectativa | Estado vacío que lleve a Ajustes/onboarding | MVP |
| U7 | Tareas (Flow, Gantt, Kanban, Planning, Progress) | Muchas vistas, nombres técnicos | Texto de ayuda por vista; vista por defecto simple | E |
| U8 | Agua, Salud, Pomodoro, Hábitos | Estados vacíos parciales | Completar | E |
Tipo: UX. Archivos: `resources/views/livewire/<modulo>`, componente `x-ui.state`.

### 7. Datos iniciales
| ID | Dato | Actual | Debería ser | Prio |
|---|---|---|---|---|
| D1 | Hábitos, ejercicio, ánimo, categorías tareas/gastos, círculos | Plantillas copiadas por usuario al registrarse (✔), restaurables (salvo bebidas) | Mantener; consolidar siembra en un único servicio `ProvisionNewUser` (hoy repartido entre `RegisterController` y `User::booted`) | MVP (consolidar, para que cualquier vía de alta siembre igual) |
| D2 | Bebidas | Inline en controlador | `DefaultDrinkTypes` + restaurar (P5) | MVP |
| D3 | Plantillas de mantenimiento | Globales (`user_id` NULL) vía `MaintenanceTemplateSeeder` | Compartidas: asegurar que el seeder corre en producción (deploy) | MVP |
| D4 | Hábitos negativos (`NegativeHabitDefinitionSeeder`) | Seeder dev recorre todos los usuarios, no en registro | Decidir: plantilla al registrar o vacío con estado guiado | E |
| D5 | Recetas/metas | Sin plantillas | Opcional ejemplos | F |

### 8. Correos y notificaciones
| ID | Gap | Situación | Prio | Acción |
|---|---|---|---|---|
| E1 | Sin proveedor de correo | `MAIL_MAILER=log` | B (prerequisito de A2/A4) | Configurar SMTP/transaccional (SES, Postmark, Resend), SPF/DKIM, remitente |
| E2 | Correo de bienvenida | No existe | E | Notificación al registrarse |
| E3 | Notificaciones / recordatorios | No existen jobs, notificaciones, scheduler (bajo riesgo de cruce hoy) | F | Al construirlos: depende de M1 + preferencias por usuario + TZ (P1) |
| E4 | Worker de cola / cron | Queue `database` sin uso; scheduler vacío | MVP si se usan colas para correos | Documentar `queue:work` + cron en despliegue |

### 9. Errores, soporte y recuperación
| ID | Gap | Situación | Prio | Acción |
|---|---|---|---|---|
| R1 | Páginas de error | No existe `resources/views/errors`; 403/404/419/500/503 son las de Laravel en inglés | MVP | Vistas con design system, en español, con botón volver; 419 con "tu sesión expiró" |
| R2 | Reportar problema | No existe | MVP | Enlace "Reportar un problema" (mailto o formulario que guarde en tabla `feedback` con user_id) |
| R3 | Rastreo de errores | Sin Sentry/Flare; handler solo personaliza `api/*` | MVP | Integrar error tracking con contexto `user_id` (sin PII) |
| R4 | Soporte operativo | Sin forma de impersonar ni panel admin | E | Comandos artisan de soporte (buscar usuario, reenviar reset) |
| R5 | Términos y privacidad | No existen | B (datos de salud/ánimo/diario son sensibles) | Páginas de términos y política de tratamiento de datos + aceptación en registro |

### 10. Operación e infraestructura
| ID | Gap | Situación | Prio | Acción |
|---|---|---|---|---|
| I1 | Backups | Sin paquete ni script | B | Backup diario de MySQL + `storage/app/public` fuera del servidor, retención, **prueba de restauración documentada** |
| I2 | Despliegue documentado | Sin script/docs de deploy; único workflow de deploy es el heredado (S2) | MVP | Runbook: `migrate --force`, `db:seed --class=MaintenanceTemplateSeeder`, caches, `storage:link`, queue, cron |
| I3 | Monitoreo / health | Solo `/up` (no verifica BD) | MVP | Uptime check externo + health que toque BD |
| I4 | Índices `(user_id, date)` | Faltan en `drink_logs`, `exercise_logs`, `mood_entries`, `energy_entries`, `negative_habit_logs`, `pomodoro_sessions`, `goal_entries`, `goal_numeric_entries`, `vehicle_energy_logs`, `vehicle_maintenance_logs` | MVP | Migración de índices compuestos |
| I5 | Consultas que no escalan | `JournalLifeCalendar.php:44-47` carga modelos completos de toda la vida para contar por semana | E | Agrupar en SQL |
| I6 | Límites de uso | Sin límites (fotos de vehículos, cantidad de registros, tokens) | E | Validar tamaño de fotos; cuotas simples |
| I7 | Tests en CI | `ui-quality.yml` corre `php artisan test` (✔) | — | Añadir M8 |

## Checklist de preparación para usuarios

### Bloqueantes (sin esto no se abre)
- [ ] S2 Eliminar `deploy.yml` heredado y rotar clave Gemini
- [ ] S1 Limpiar caché del service worker en logout
- [ ] S3 Producción con `APP_DEBUG=false`, `APP_ENV=production`, HTTPS
- [ ] A1 Throttling en login y registro
- [ ] A3 Registro controlable (flag / invitación) para beta cerrada
- [ ] E1 Proveedor de correo transaccional configurado
- [ ] A2 Recuperación de contraseña funcional end-to-end
- [ ] M1 Scope `BelongsToUser` fail-closed sin usuario autenticado
- [ ] A7 Eliminación de cuenta (borrado completo + tokens + archivos)
- [ ] R5 Términos y política de datos + aceptación en registro
- [ ] I1 Backups automáticos fuera del servidor + restauración probada

### Necesario para MVP (antes de la prueba con usuarios)
- [ ] A4 Verificación de correo · A5 política de contraseña · A6 cerrar otras sesiones · A9 cookies seguras
- [ ] O1 Onboarding corto (bienvenida, zona horaria, datos básicos, módulos de interés)
- [ ] O2 "Primeros pasos" en dashboard · O4 descripción de cada módulo
- [ ] P1 Zona horaria por usuario · P2 locale `es` consistente · P5/D2 bebidas restaurables · P6 integraciones como "avanzado"
- [ ] M2 `user_id` + FK compuesta en pivotes de Planes · M4 `#[Locked]` en ids · M6 propósito de tokens · M8 test de aislamiento por modelo
- [ ] S3 headers de seguridad · S4 throttle en `/dav`
- [ ] U1–U4, U6 estados vacíos útiles en módulos que requieren setup
- [ ] D1 servicio único de aprovisionamiento · D3 seeder de plantillas en deploy
- [ ] R1 páginas de error en español · R2 reportar problema · R3 error tracking
- [ ] I2 runbook de despliegue · I3 monitoreo · I4 índices `(user_id, date)` · E4 cola/cron si se usan correos en cola

### Puede esperar
A7-exportación, A8, O3, P3, P4, M3, M4-policies, M5, M7, S5, S6, U5, U7, U8, D4, E2, R4, I5, I6

### Futuro
P7 moneda/unidades, D5 plantillas de recetas/metas, E3 recordatorios y notificaciones programadas.

**Criterio de "listo":** todos los ítems Bloqueantes y MVP marcados + una prueba manual con una cuenta nueva (registro → verificación → onboarding → primer registro en 3 módulos → logout → reset de contraseña → eliminación de cuenta) y el test M8 en verde.
