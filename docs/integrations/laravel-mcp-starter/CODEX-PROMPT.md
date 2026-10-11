# Solicitud portable para Codex

Copia el texto siguiente en el repositorio destino y adjunta esta carpeta completa. Si se copia fuera de `docs/integrations`, ajusta únicamente su ubicación en la solicitud.

---

Implementa un módulo interno MCP remoto con OAuth por usuario en esta aplicación Laravel. Lee primero `AGENTS.md` y los tres documentos de `docs/integrations/laravel-mcp-starter`: `README.md`, `VALIDATION.md` y `CODEX-PROMPT.md`. Si la carpeta fue adjuntada, usa esos documentos equivalentes. La implementación debe ser utilizable sin acceder al repositorio Life Tracker.

Concentra servidor, herramientas, autenticación, autorización y soporte en `app/Mcp`, con puntos explícitos de integración en rutas, providers, configuración, vistas y migraciones. Reutiliza los servicios funcionales del monolito. Esta solicitud no pide un microservicio separado ni un paquete Composer compartido.

Antes de cambiar código, inspecciona versiones instaladas y lock, guards/providers, modelos de usuario, permisos, Policies/Gates, APIs y tenancy. Selecciona versiones compatibles de Laravel MCP y Passport usando documentación oficial correspondiente; no impongas las versiones históricas de la guía ni actualices dependencias ajenas. Conserva cambios de otras tareas.

Implementa descubrimiento, registro de clientes compatible con los consumidores objetivo, consentimiento web, authorization code con PKCE S256, expiración, refresco y revocación por usuario. Verifica claves persistentes sin imprimirlas ni reemplazarlas automáticamente. Configura HTTPS y caché conforme al despliegue. Valida redirects registrados; distingue callbacks OAuth de Origin HTTP y prueba loopback si hay clientes de escritorio. No usar wildcards para resolver fallos.

Separa autenticación, scopes y autorización funcional. `mcp:use` no concede permisos administrativos. Resuelve identidad y organización desde información verificada; aplica permisos actuales y acceso al registro en cada ejecución. Filtra el catálogo y reautoriza llamadas directas. Nunca permitir que argumentos de la IA cambien el usuario/tenant autorizado. Comprueba resource/audiencia y rechazo de tokens destinados a otros recursos; no copies el pendiente de Life Tracker como control suficiente.

Si existen Sanctum/Entrust, preserva sus APIs y contratos: no sustituyas traits o guards automáticamente ni combines HasApiTokens sin resolver sus conflictos. Si hay tenancy, decide y documenta dónde viven clientes/códigos/tokens/refresh y cómo se mantiene el contexto en descubrimiento, consentimiento, emisión, ejecución y revocación. Deniega contextos ambiguos y prueba usuarios con IDs coincidentes en tenants distintos.

Define una matriz de herramientas candidatas a partir de servicios y permisos reales. Empieza por una lectura y una modificación de un dominio existente, con administrador autorizado y usuario limitado; no expongas automáticamente todo el producto. Si el alcance funcional no está especificado y elegirlo cambia materialmente el resultado, solicita esa decisión y continúa con la infraestructura independiente. Los ejemplos de la guía no son permisos ni modelos reales del proyecto.

Valida entradas, serializa salidas sin secretos, limita consultas y conserva reglas transaccionales. Mantén Bearer manual solo si existe una integración que lo necesite; OAuth es el camino preferido. Verifica versiones y transporte MCP contra la revisión anunciada; revisa si el paquete ya incorpora las correcciones históricas antes de añadir adaptaciones.

Registra evidencia antes de corregir fallos y añade regresión para defectos confirmados. Ejecuta la matriz aplicable de VALIDATION.md con base y claves aisladas: PKCE real, refresh, revocación, scopes, permisos retirados con token vigente, llamadas directas no autorizadas, usuarios/tenants separados y regresión de APIs existentes. No usar únicamente actingAs para acreditar OAuth.

No hagas commits, pushes, despliegues ni modificaciones de datos reales. Las pruebas de clientes deben distinguir Codex escritorio, CLI, ChatGPT web, Claude y Grok web de sus APIs. Si falta acceso, deja pendiente esa validación y pide evidencia concreta redactada; sigue con el trabajo independiente. Un login o una prueba genérica no acredita tools/call desde cada cliente.

Entrega la implementación local, sus pruebas y `docs/integrations/mcp-implementation.md` con arquitectura, versiones, puntos de integración, matriz normativa con fecha/revisión y MUST/SHOULD/MAY, decisiones de autorización/tenancy, evidencias, comandos/resultados, procedimiento de despliegue/rollback y pendientes. Ejecuta `git diff --check` y las validaciones pertinentes a las superficies modificadas. Distingue implementado, verificado, informado por el usuario y pendiente; no declares certificación íntegra MCP/OAuth.
