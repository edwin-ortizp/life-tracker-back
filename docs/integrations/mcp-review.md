# Revisión MCP — 11 de octubre de 2026

## Actualización: Codex de escritorio con OAuth

El usuario aclaró que la conexión pendiente corresponde a Codex de escritorio, servidor localmente configurado como `mupo`, no a chatgpt.com. Grok ya funciona según su prueba. El 11-10-2026 se ejecutó `codex mcp login mupo --oauth-client-registration dcr --scopes mcp:use`: registro rechazado con HTTP 400, `invalid_redirect_uri`, `redirect_uris.0 is not a permitted redirect domain.` No se alcanzó el consentimiento.

La [documentación oficial de Codex](https://learn.chatgpt.com/docs/extend/mcp) establece callbacks HTTP loopback para escritorio, con puerto local variable. La configuración de Life Tracker no permitía loopback. Reproducción local previa al cambio: callback `http://127.0.0.1:54321/callback/codex-client` recibe 400; 8/9 pruebas de registro pasan y falla este caso. Corrección justificada: habilitar `http://127.0.0.1` en redirect_domains. El validador del paquete, al reconocer loopback, admite localhost/127.0.0.1/[::1] con puerto variable; no autoriza hosts externos ni prefijos similares. Es un callback al equipo del usuario, no publicar el servidor MCP en localhost. La URI concreta se registra y Passport la compara en el canje. No se cambia allowed_origins ni se añaden Bearer manuales.

Pendiente: publicar la configuración y regenerar su cache, repetir login OAuth y verificar herramientas desde Codex. No declarar conexión validada antes del consentimiento y la inicialización.

Estado: revisión local, suite final y comprobaciones públicas realizadas; diagnóstico de los intentos de clientes pendiente de logs/acceso. No acredita compatibilidad real con clientes web.

## Evidencia previa a correcciones

- Producción, 15:34:51–15:35:16 UTC: HTTPS válido desde curl, metadatos AS y recurso anidado HTTP 200; POST sin token HTTP 401 con `resource_metadata`; GET MCP HTTP 405 con `Allow: POST` (permitido para transporte sin stream GET).
- Los metadatos AS omiten `token_endpoint_auth_methods_supported`, aunque DCR crea clientes públicos con método `none`. RFC 8414 §2 establece `client_secret_basic` como valor implícito. Contradicción comprobada entre descubrimiento y registro; no demuestra por sí sola el fallo de ChatGPT.
- `AuthenticateMcpRequest` responde 401 a un token válido sin `mcp:use`; MCP autorización y RFC 6750 §3.1 distinguen permisos insuficientes (403). La prueba existente exige ese 401 incorrecto.
- Baseline local: 158 pruebas, 153 pasan y 5 fallan por `Invalid key supplied` en OAuth. No hay claves Passport válidas disponibles para esta suite; se aislarán claves efímeras en las pruebas, sin generar/reemplazar claves de aplicación.
- Instalado: Laravel MCP 0.9.5; composer.lock: 0.9.4. Passport 13.8.0 en ambos. No se actualizarán dependencias durante esta revisión.

Las correcciones se limitarán inicialmente a metadatos, respuesta de scope y aislamiento de claves de pruebas. Riesgos: cambio esperado de 401 a 403 para OAuth sin permisos; clientes pueden seleccionar explícitamente `none`. Bearer de integración conserva su comportamiento.

Fuentes: https://www.rfc-editor.org/rfc/rfc8414.html ; https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization ; https://developers.openai.com/plugins/build/auth

### Transporte: reproducción antes de editar

Tres pruebas HTTP aisladas fallan: versión initialize desconocida devuelve error en vez de proponer versión soportada; `MCP-Protocol-Version: 2099-01-01` recibe 200 en lugar de 400; `Origin: https://untrusted.example` recibe 200 en lugar de 403. Lifecycle §Version Negotiation y Transports §Security / Protocol Version Header de MCP 2025-11-25 contienen requisitos MUST para los tres casos.

Corrección mínima prevista: negociación en el servidor propio y middleware del endpoint para versión/Origin, sin tocar vendor. Permitir peticiones sin Origin (clientes remotos servidor a servidor) y los orígenes explícitos de configuración, por defecto únicamente APP_URL. Riesgo: clientes que envíen Origin deben estar autorizados explícitamente; no se deducirá confianza de un wildcard ni de la allowlist OAuth de callbacks.

## Recorrido y componentes

`routes/ai.php` registra `/life-tracker` mediante Laravel MCP. La aplicación usa Passport en el guard `api` y middleware propio para convivir con IntegrationToken. Los tokens `lt_ai_`, `lt_ob_` y `lt_cd_` se resuelven por hash SHA-256, usuario existente y ausencia de revocación; actualizar `last_used_at` es parte de su uso. OAuth valida firma, fechas y revocación mediante Passport/League y exige `mcp:use`. Ambos caminos establecen el usuario del guard por defecto y del request.

El servidor declara 81 herramientas, sin recursos ni prompts propios. El catálogo tiene páginas de 15 elementos, máximo solicitado 50; se debe seguir `nextCursor`. Cada POST se atiende de forma independiente. Laravel MCP emite un identificador al inicializar, pero no mantiene un almacén de sesiones que vincule ese identificador al usuario: la identidad efectiva procede del bearer en cada solicitud. No hay stream GET ni reanudación con Last-Event-ID. Las respuestas de herramientas usan el transporte JSON o SSE de la dependencia; no se requiere un stream GET para aceptar resultados SSE de POST.

OAuth sigue metadatos del recurso → metadatos AS → DCR → autorización/consentimiento web → código con PKCE → token → llamadas MCP. Passport configura access tokens de una hora y refresh de 30 días. Ajustes permite revocar tokens propios y su refresh asociado; hay pruebas para impedir revocar los de otro usuario.

El scope `BelongsToUser` depende de usuario autenticado. La autenticación anterior al despacho es esencial: no se considera que el trait proteja contextos anónimos. La suite existente cubre operaciones e aislamiento en módulos; la nueva prueba HTTP verifica que un Bearer no lea hábitos ajenos. Esto no equivale a una auditoría independiente de cada posible combinación de argumentos de las 81 herramientas.

## Evidencia pública reproducible

Fecha: 2026-10-11, 10:34:51–10:35:16 America/Bogota (15:34:51–15:35:16 UTC). Curl no utilizó `-k`, credenciales ni seguimiento de redirecciones. No se creó un cliente OAuth en producción ni se llamó una herramienta autenticada.

| Petición | Resultado observado | Evidencia relevante |
|---|---|---|
| GET `/.well-known/oauth-authorization-server` | 200 JSON | issuer y endpoints HTTPS del mismo host; S256; authorization_code/refresh_token; falta el campo de métodos de autenticación |
| GET `/.well-known/oauth-protected-resource/life-tracker` | 200 JSON | resource `https://lifetracker.novapixel.org/life-tracker`; authorization_servers apunta al host; scope mcp:use |
| POST `/life-tracker`, cuerpo `{}`, sin token | 401 JSON | WWW-Authenticate Bearer con resource_metadata anidado correcto |
| GET `/life-tracker` | 405, cuerpo vacío | Allow: POST |

Segunda comprobación, **10:47:59 America/Bogota / 15:47:59 UTC**:

- POST `/life-tracker`, cuerpo `{}`, Accept JSON/SSE y `Authorization: Bearer invalid-review-token`: **500 HTML**, sin WWW-Authenticate. Request ID Hostinger: `3f8ba0f3e22ed9ecd6d4de6b8eed893c-imm-edge6`.
- GET `/.well-known/oauth-protected-resource`: 200 JSON, resource identifica la raíz del host. La variante anidada identifica el endpoint específico.

**F15 — Problema confirmado de producción, causa pendiente:** la ruta que intenta validar un bearer no reconocido por los prefijos de integración falla antes de devolver 401. El contraste con el POST sin token reduce el área de investigación al guard OAuth y sus dependencias, sin probar una excepción concreta. Claves Passport ausentes/ilegibles es una hipótesis compatible con el baseline local, pero requiere el log de producción de esa hora. No ocultar la excepción devolviendo 401 indiscriminadamente ni generar/reemplazar claves sin inspeccionar la configuración vigente. Riesgo de reemplazar claves: invalidar tokens OAuth existentes.

Actualización F15 con log aportado por el usuario: entrada prod n.º 34, **2026-10-11 10:47:59**, `LogicException: Invalid key supplied`, `CryptKey.php:77`, llamada desde `PassportServiceProvider::registerResourceServer()` → `makeCryptKey()`. La construcción del resource server utiliza **la clave pública**. Queda confirmada la configuración no utilizable de esa clave en producción, antes de validar el bearer. Passport toma `config('passport.public_key')` (normalmente PASSPORT_PUBLIC_KEY), o `storage/oauth-public.key` si no hay contenido configurado. Falta inspeccionar configuración efectiva y existencia del archivo para distinguir clave PEM inválida de ruta/archivo ausente. La clave privada y la correspondencia del par tampoco se han verificado. La hora corresponde a la prueba curl de esta revisión; no se atribuye automáticamente a un intento Grok.

Acción justificada: restaurar/configurar el par Passport existente en el despliegue y refrescar la configuración cacheada según el procedimiento de producción. No regenerar con `--force`. Si nunca existió un par, generar uno nuevo solo tras comprobarlo. Validación posterior: bearer inválido debe responder 401 con discovery, seguido de canje PKCE y conexión real. No es necesario cambiar el middleware para ocultar esta excepción.

Actualización de producción, **2026-10-11 11:00:13–11:00:15 America/Bogota / 16:00:13–16:00:15 UTC**: el mismo POST con bearer deliberadamente inválido ahora responde **401 application/json** y WWW-Authenticate correcto (request ID `34005d5ab273d7dba11b8cc47f459da6-imm-edge3`). El fallo 500 de validación pública ya no se reproduce. Metadatos AS y recurso anidado responden 200; AS ahora anuncia `token_endpoint_auth_methods_supported` con none/basic/post. Esto verifica F1 en el despliegue y la recuperación de la carga de clave pública; no prueba la clave privada ni el canje de código. El usuario informa que Grok sigue mostrando el error genérico: falta identificar si falla antes o después de authorize y obtener la petición/respuesta correspondiente. No atribuir el nuevo fallo a claves sin una excepción nueva.

Infraestructura visible: Hostinger/hcdn, PHP 8.4.26, caché DYNAMIC, metadatos con límite 20 por minuto. El POST sin credenciales no permite evaluar inicialización, herramientas ni firma de tokens. Estos endpoints no prueban qué commit o versión de dependencia está desplegado.

Reproducción sin secretos desde PowerShell:

```powershell
curl.exe -sS -D - --max-time 25 https://lifetracker.novapixel.org/.well-known/oauth-authorization-server
curl.exe -sS -D - --max-time 25 https://lifetracker.novapixel.org/.well-known/oauth-protected-resource/life-tracker
curl.exe -sS -D - --max-time 25 -X POST -H 'Content-Type: application/json' --data '{}' https://lifetracker.novapixel.org/life-tracker
curl.exe -sS -D - --max-time 25 https://lifetracker.novapixel.org/life-tracker
```

La consulta inicial desde el sandbox falló por resolución DNS; la misma consulta con acceso de red funcionó. No atribuir ese primer error al servicio.

## Matriz de cumplimiento y hallazgos

Base de contraste: revisión publicada MCP 2026-07-28 y versión más reciente que anuncia este servidor, 2025-11-25. No anunciar 2026-07-28 sin implementar sus cambios de transporte. OAuth 2.1 sigue siendo un borrador IETF; la documentación anterior no debe interpretarse como certificación de conformidad completa.

| ID / clasificación | Requisito y evidencia | Resultado / decisión |
|---|---|---|
| F1 Problema confirmado | RFC 8414 §2: omitir métodos implica client_secret_basic; DCR devuelve none y el canje público funciona localmente | Corregido localmente: anunciar none/basic/post; verificar tras desplegar. Posible factor de interoperabilidad, causa de ChatGPT no confirmada |
| F2 Problema confirmado | MCP Authorization Error Handling: 403 para scopes insuficientes; middleware y prueba anterior exigían 401 | Corregido localmente: 403 + insufficient_scope, scope y resource_metadata. Prueba OAuth real pasa |
| F3 Problema confirmado | Lifecycle 2025-11-25: proponer versión soportada si no se conoce la solicitada; reproducción devolvió error -32602 | Corregido en LifeTrackerServer, conservando versión cuando está soportada. No afirma que el cliente real enviara una versión nueva |
| F4 Problema confirmado | Transports 2025-11-25: cabecera de versión no soportada debe producir 400; ping respondió 200 | Corregido mediante middleware del endpoint |
| F5 Problema confirmado | Transports: validar Origin y rechazar el no permitido con 403; ping con Origin ajeno respondió 200 | Corregido para POST/GET/DELETE; lista independiente, sin wildcard. Peticiones sin Origin conservadas |
| F6 Comportamiento correcto | Resource Metadata y WWW-Authenticate: descubrimiento obligatorio cuando se ofrece autorización | Verificado públicamente para recurso anidado y challenge; pruebas cubren también raíz |
| F7 Comportamiento correcto | PKCE S256, códigos de un uso, firma/expiración/revocación y scopes | Canje, denegación por scope, expiración, replay y refresh probados localmente; no comprobados en producción |
| F8 Comportamiento correcto | Transporte 2025-11-25 permite 405 al GET cuando no hay stream independiente; DELETE puede rechazarse | No añadir SSE GET ni endpoint legado como supuesto arreglo |
| F9 Mejora recomendada | CIMD es SHOULD; DCR es MAY y está deprecado en 2026-07-28 | No se anuncia ni implementa CIMD. DCR no prueba incumplimiento obligatorio ni causa del fallo. Sin cambios especulativos |
| F10 Mejora recomendada | Tools: annotations y outputSchema son opcionales | Las herramientas no declaran hints propios; puede mejorar identificación de lecturas/escrituras. No impide por sí solo tools/list; no se añadieron |
| F11 Hipótesis pendiente | AS/Passport no implementan binding explícito RFC 8707 a la URI del recurso; JWT estándar aud contiene client_id, middleware valida mcp:use | La ausencia se observa en código de League/Passport; falta prueba dirigida de emisión con resource diferente y análisis de vinculación por scope antes de atribuir vulnerabilidad o fallo real. No cambiar formato de tokens ni invalidar sesiones sobre esta hipótesis |
| F12 Problema confirmado | Grok devuelve `Failed to register client` con `invalid_redirect_uri`, `redirect_uris.0 is not a permitted redirect domain`; callback observado https://grok.com/connectors-oauth-exchange-code/ | Reproducido localmente: 400 donde se esperaba 201. Corrección justificada: añadir exclusivamente https://grok.com a redirect_domains; conservar rechazo de dominios ajenos y suplantaciones |
| F13 Hipótesis pendiente | Cuotas 20/min metadatos/registro y 60/min MCP pueden causar 429 | No existe captura de 429 de los clientes. Conservar límites; correlacionar logs antes de cambiarlos |
| F14 Problema confirmado de entorno | Inicialmente vendor MCP 0.9.5 y lock 0.9.4; Composer concurrente instaló log-viewer y dejó temporalmente PHPUnit inconsistente | Preservar trabajo del usuario. Revalidar contra dependencias finales; no extrapolar resultados de una versión a otra |

La adopción de la revisión 2026 exige trabajo específico (sesiones, cabeceras y otros cambios); no es necesario que un servidor soporte todas las revisiones futuras para negociar una anterior. Las correcciones F3/F4 se rigen por las revisiones que ya se anuncian.

## Compatibilidad de clientes web

| Cliente | Documentación oficial y requisitos identificados | Estado de esta revisión |
|---|---|---|
| Claude web | Custom connectors remotos; autenticación OAuth o credenciales fijas mediante Request headers; conexión desde infraestructura de Anthropic | Bearer funciona según el usuario. Regresión local cubierta; no se accedió a su cuenta ni se repitió la conexión real |
| ChatGPT web | Flujo documentado ofrece OAuth, sin autenticación, o combinación; no ofrece el Bearer manual como equivalente general. OAuth admite clientes predefinidos, DCR o CIMD según configuración, PKCE y descubrimiento | El intento de Bearer puede corresponder a limitación de esa superficie. No confundir con API OpenAI, que permite enviar autorización. OAuth aún requiere captura del fallo real |
| Grok web | Documenta servidores MCP personalizados, descubrimiento de herramientas y alcance público; Business/Enterprise depende de provisión por administrador | La página general no especifica suficientemente DCR, callback, métodos de token ni soporte Bearer manual. No inferirlos de la API xAI. Se necesitan error y solicitud reales |

ChatGPT documenta callbacks variables bajo `https://chatgpt.com/connector/oauth/{callback_id}` y estable bajo el mismo host en otras condiciones; la allowlist actual cubre ese host. No se comprobó un callback rechazado de ChatGPT. No añadir callbacks heredados ni abrir dominios como explicación automática.

Fuentes consultadas el 11-10-2026:

- [ChatGPT: conectar un MCP](https://developers.openai.com/api/docs/guides/custom-mcp-server)
- [OpenAI: autenticación, DCR/CIMD, callbacks y resource](https://developers.openai.com/plugins/build/auth)
- [Claude: custom connectors remotos](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
- [Grok web: conectores](https://docs.x.ai/grok/connectors)
- [Grok web: gestión por administradores](https://docs.x.ai/grok/connector-management)
- [xAI API: Remote MCP Tools, superficie distinta](https://docs.x.ai/developers/tools/remote-mcp)
- [MCP 2026-07-28: autorización](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [MCP 2026-07-28: transporte](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 2025-11-25: lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle)
- [MCP 2025-11-25: transporte](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP 2025-11-25: herramientas](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html), [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414.html), [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728.html), [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html)

## Pruebas y pendientes de cierre

| Ejecución | Resultado |
|---|---|
| Baseline MCP/OAuth instalado inicialmente | 158 pruebas, 153 pasan; 5 fallan por claves Passport del entorno |
| OAuth con claves RSA efímeras, F1/F2 | 20/20, 82 assertions |
| OAuth ampliado + recorrido HTTP | 28/28, 409 assertions |
| Reproducción transporte antes de F3/F4/F5 | 3/3 fallan, demostrando los defectos |
| OAuth + HTTP tras F3/F4/F5 | 31/31, 413 assertions |
| Suite tras últimas ampliaciones | Bloqueada al arrancar PHPUnit: falta TestSuiteSkippedSubscriber.php durante cambio concurrente de dependencias |
| Reintento final `php artisan test --filter='OAuth\|Mcp'`, tras regeneración de autoload | **173/173 pruebas, 1120 assertions, 13.178 s**; ya no bloqueado |

La validación final se realizó con Laravel MCP **0.9.4**, Passport **13.8.0** y PHPUnit **12.5.33** después de la instalación del log-viewer por el usuario. El código de esta revisión no actualizó Composer. Las pruebas de la dependencia inicialmente instalada 0.9.5 se distinguen de este resultado final. Sintaxis PHP de archivos editados y `git diff --check` del alcance propio: correctos. No se ejecutó build ni conformidad UI porque no se modificaron assets ni vistas en esta revisión.

Las pruebas nuevas incluyen paginación de las 81 herramientas, nombres únicos, descripción y esquema de entrada tipo object; no se ejecutaron las 81 herramientas contra producción. La suite de módulos existente comprueba escrituras en SQLite en memoria, validaciones, serialización e idempotencia según cada caso. No hay nuevas pruebas de UI ni cambios de assets.

El histórico local revisado contiene errores de testing (incluidas claves inválidas y SQLite bloqueada); no es evidencia de peticiones de ChatGPT/Grok a producción. No se capturaron secretos ni se copiaron logs completos al informe.

Pendientes concretos:

1. Validación local final completada: 173 pruebas aprobadas. Repetir únicamente si se modifica código o cambian de nuevo las dependencias.
2. Recibir errores exactos y horas de intentos, logs Laravel/Hostinger y, si existe, traza de access log por endpoint y estado. No basta Laravel.log si la petición se rechaza en CDN/WAF o antes de Laravel.
3. Para cada cliente, correlacionar el primer GET de metadata, POST MCP, DCR y navegación authorize/token; registrar qué paso nunca ocurrió. Si no hay solicitudes, investigar configuración del cliente/red antes de tocar OAuth.
4. Probar conexión autenticada real y lectura no sensible en las tres cuentas cuando haya acceso. No registrar compatibilidad como validada por pruebas PHPUnit.
5. Verificar en producción F1–F5 solo después de un despliegue autorizado; no se realizó despliegue en esta revisión.
6. Completar prueba dirigida de resource/audiencia y revisión de políticas de tokens anteriores antes de diseñar cualquier cambio de emisión/validación.

Conclusión actual: hay defectos locales reproducibles corregidos; el fallo 500 de claves ya no se reproduce, y el primer bloqueo de Grok está confirmado como rechazo de su callback durante DCR. La conexión completa de Grok y el diagnóstico de ChatGPT siguen pendientes; no corresponde afirmar conformidad íntegra ni compatibilidad completa.

## Diagnóstico confirmado del registro de Grok

Evidencia aportada por el usuario: POST `https://grok.com/rest/oauth/auth-url`, HTTP 500, 2026-10-11 11:10:52 America/Bogota. Respuesta JSON: `code: 13`, `Failed to register client: Client registration failed: {"error":"invalid_redirect_uri","error_description":"redirect_uris.0 is not a permitted redirect domain."}`. El request de Grok contiene redirectUrl `https://grok.com/connectors-oauth-exchange-code/`.

Secuencia comprobada: Grok intenta DCR → Life Tracker rechaza el callback por su política de dominios → Grok convierte el rechazo en 500 y muestra un toast genérico antes del consentimiento. Este rechazo de validación no necesita generar una excepción en Laravel.log. La ausencia de logs de error es compatible con esta respuesta 400 esperada del registro.

Antes de corregir configuración, ClientRegistrationTest reproduce el callback: 7 pruebas, 6 pasan y la del callback real falla (esperado 201, obtenido 400). La modificación afecta solo config/mcp.php y el registro OAuth de clientes con callbacks HTTPS en grok.com. No modifica allowed_origins, scopes, transporte ni tokens. Riesgo acotado: se permite registrar callbacks en ese host; Passport sigue comprobando la URI registrada al autorizar/canjear códigos. No se habilitan wildcards ni hosts de prefijo similar.

Este diagnóstico reemplaza F12 como hipótesis: hay evidencia suficiente del primer bloqueo de Grok. La conexión completa sigue pendiente de despliegue de esta configuración, actualización del cache y reintento real; no implica que no pueda existir otro fallo posterior. El diagnóstico de ChatGPT continúa separado.

Resultado posterior: `php artisan test --filter=ClientRegistrationTest`, **7/7 pruebas, 21 assertions**; acepta el callback real de Grok y rechaza `grok.com.attacker.example`, conservando los casos anteriores de Claude/ChatGPT. `git diff --check` correcto. No se desplegó ni se mutaron clientes OAuth de producción.
