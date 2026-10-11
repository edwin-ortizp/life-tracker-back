# Validación, operación y diagnóstico

Complemento autocontenido de [README.md](README.md). Ejecuta pruebas en una base aislada con claves RSA efímeras y datos ficticios; comprueba conexión, nombre de base y entorno antes de migraciones o limpieza. Nunca ejecutar `migrate:fresh` sobre una base real. No desplegar ni modificar datos personales para demostrar compatibilidad.

## Evidencias y clasificación

Registra fecha/hora con zona, entorno, versiones lock/instaladas, revisión MCP, método, endpoint, estado HTTP, cabeceras relevantes, cuerpo redactado y request ID. Excluye Authorization, cookies, códigos OAuth, verificadores PKCE, secretos y datos personales. No habilitar logs de cuerpos sensibles como solución genérica.

Clasifica cada resultado como prueba automatizada local, observación HTTP pública, prueba directa en el producto o informe del usuario. Una prueba local o Inspector no prueba compatibilidad con una aplicación. Identifica el primer paso fallido antes de modificar código.

Para cada hallazgo documenta: confirmado/recomendación/hipótesis, reproducción, requisito y sección/revisión (MUST/SHOULD/MAY cuando aplique), causa, impacto, corrección mínima, riesgos y prueba de regresión. Si no hay evidencia, conserva la hipótesis y solicita la captura concreta que falta.

## Matriz mínima de pruebas aisladas

| Área | Casos y resultado exigido |
|---|---|
| Descubrimiento | AS y recurso específico accesibles; issuer/resource/endpoints HTTPS coherentes; métodos, scopes, grants y PKCE anunciados coinciden con el comportamiento |
| Registro | Cliente legítimo aceptado; redirect externo no permitido, host parecido y esquema indebido rechazados; secretos no expuestos |
| Consentimiento | Usuario autenticado y contexto correctos; aceptar/rechazar; CSRF; scope no concedido no aparece en token; no saltar consentimiento sin política explícita |
| Código/PKCE | Canje S256 real; verifier erróneo, código reutilizado, código expirado y redirect cambiado rechazados; cliente público sin secreto |
| Tokens | Ausente, inválido, expirado y revocado: 401 con challenge apropiado; token válido sin scope: 403 insufficient_scope; ningún caso produce 500 por configuración |
| Refresh/revocación | Refresco válido; política de rotación/reutilización probada; refresh revocado/expirado rechazado; revocar conexión corta access y refresh; no permite revocar conexión ajena |
| Audiencia/recurso | Solicitar recurso correcto, recurso diferente y omitido según política documentada; rechazo de tokens destinados a otro recurso/AS; no inferir seguridad de aud=client_id |
| Inicio MCP | initialize, versión negociada, notifications/initialized y respuesta de notificación conforme al transporte; cabecera de versión inválida y Origin no autorizado rechazados |
| Transporte | Content-Type/Accept, JSON/SSE, GET/DELETE, errores JSON-RPC y sesiones según versión; sin redirección a login HTML; cada petición autenticada, sin compartir identidad por sesión |
| Catálogo | Todas las páginas nextCursor; nombres únicos, esquemas objeto válidos; catálogo limitado por permisos; cambios de usuario/permisos no reutilizan catálogo privado ajeno |
| Ejecución | Lectura y escritura real con fixtures; validación de argumentos, límites, errores, serialización sin secretos y efectos transaccionales de servicios |
| Autorización | Admin autorizado modifica; usuario limitado lee solo lo permitido y no modifica; tools/call directo de herramienta oculta denegado; retirar permiso con token vigente tiene efecto |
| Aislamiento | Usuario A no consulta/modifica datos ni conexiones de B; argumentos de identidad no amplían acceso; deshabilitar usuario retira acceso conforme a reglas del producto |
| Tenancy | Host/contexto ambiguo denegado; usuario central/tenant correctamente resuelto; tokens no cruzan tenants; mismo ID en dos tenants no mezcla datos; membership retirado denegado |
| Regresión | Sanctum/APIs/web existentes conservan identidad y permisos; Bearer manual existente mantiene su contrato, incluyendo credenciales inválidas y revocadas |

Adapta las expectativas de transporte a la revisión soportada. Distingue HTTP 403 del middleware de una denegación funcional representada como error de herramienta MCP; verifica el contrato real sin filtrar existencia de registros privados. No usar `actingAs` como única prueba OAuth: debe existir al menos un recorrido que emita y valide tokens reales mediante PKCE.

Ejecuta los filtros de pruebas afectados mediante el runner del proyecto (por ejemplo `php artisan test --filter=Mcp`), luego las regresiones de autenticación existentes. Asegura que el filtro selecciona pruebas. Correcciones web requieren sus comprobaciones de assets/UI; cambios solo documentales requieren referencias y `git diff --check`. Repite lo afectado después de la última corrección.

## Validación por cliente

Mantén una fila por **producto y superficie**, no solo por proveedor:

| Cliente/superficie | Registro y consentimiento | initialize/catálogo completo | Lectura real | Escritura aislada | Evidencia/fecha |
|---|---|---|---|---|---|
| Codex escritorio | Pendiente | Pendiente | Pendiente | Pendiente | Sin extrapolar del CLI |
| Codex CLI, si se usa | Pendiente | Pendiente | Pendiente | Pendiente | Separar login de ejecución |
| ChatGPT web | Pendiente | Pendiente | Pendiente | Pendiente | No equivale a Codex |
| Claude web/escritorio | Pendiente | Pendiente | Pendiente | Pendiente | Separar OAuth de Bearer manual |
| Grok web | Pendiente | Pendiente | Pendiente | Pendiente | No equivale a API xAI |

Actualiza solo las filas efectivamente comprobadas. Si no tienes cuenta/acceso, registra pendiente y pide mensaje exacto, hora y respuesta redactada de la petición fallida. No solicitar tokens. Las escrituras se prueban únicamente sobre fixtures o un entorno aislado.

## Procedimiento de despliegue propuesto

Este procedimiento prepara una entrega; ejecutarlo en producción requiere autorización del responsable.

1. Registrar decisiones de guard/provider, contexto OAuth, scopes, callbacks, versión MCP y pruebas aprobadas. Resolver o declarar bloqueantes de seguridad antes de exposición pública.
2. Preparar respaldo y migraciones revisadas para la conexión correcta. Revisar disponibilidad de claves persistentes existentes y su acceso por el proceso PHP.
3. Configurar HTTPS, proxies, issuer/resource, cuotas y listas explícitas. Mantener secretos fuera del repositorio. Preparar consentimiento y revocación.
4. Aplicar migraciones y caché de configuración por el procedimiento habitual del producto; reiniciar workers persistentes si corresponde.
5. Verificar desde fuera TLS, metadatos, challenge 401 y callbacks; después autorización real y herramientas con datos de prueba autorizados. Comparar versión desplegada con la validada.
6. Preparar rollback de código/configuración compatible con las migraciones. No borrar tablas OAuth ni rotar claves como rollback automático; documentar consecuencias sobre tokens existentes.

## Diagnóstico por primer paso fallido

| Síntoma/evidencia | Comprobación siguiente |
|---|---|
| DNS/TLS falla desde un entorno | Contrastar otro cliente HTTP/red y certificado; el fallo de una herramienta no prueba caída del servicio |
| Invalid key supplied | Configuración efectiva pública/privada, archivos, permisos y par persistente; no ocultar con 401 ni regenerar con --force |
| invalid_redirect_uri en registro | Capturar callback exacto y compararlo con política; aceptar únicamente callback legítimo con regresión contra suplantaciones |
| Popup abre y cierra | Inspeccionar Network de la ventana principal y respuesta del backend del cliente; puede fallar antes del consentimiento |
| Token válido sin permiso | Separar scope de Policy/Gate/tenant; verificar 403 de scope o error MCP funcional correspondiente |
| Conecta pero faltan herramientas | Seguir nextCursor, revisar filtros por permisos y límites; no aumentar cuota sin evidencia de 429 |
| 500 en backend del cliente | Leer su cuerpo: puede envolver un 400 de registro del servidor; correlacionar hora/endpoint |
| No hay excepción Laravel | Revisar access logs/estados HTTP disponibles; una validación 400 puede no generar excepción registrada |
| Login correcto pero tools/call falla | Comprobar Authorization en cada petición, resource/audiencia, scope, versión, contexto y permisos actuales |

Las pruebas públicas sin credenciales pueden usar lo siguiente sustituyendo el dominio y ruta por valores reales:

```powershell
curl.exe -sS -D - --max-time 25 https://app.example/.well-known/oauth-authorization-server
curl.exe -sS -D - --max-time 25 https://app.example/.well-known/oauth-protected-resource/mcp
curl.exe -sS -D - --max-time 25 -X POST -H 'Content-Type: application/json' --data '{}' https://app.example/mcp
```

La última petición prueba el rechazo sin token, no inicialización ni compatibilidad. No colocar credenciales en comandos que se compartirán como evidencia.

## Aceptación y entrega

- Módulo localizado, puntos de integración documentados y lógica de negocio reutilizada.
- Recorrido OAuth/MCP completo y matriz de seguridad aplicable aprobados en entorno aislado; discrepancias resource/audiencia resueltas antes de declarar conformidad de autorización.
- APIs existentes sin regresión; pruebas posteriores al último cambio registradas con entorno y versiones.
- Compatibilidad por cliente identificada como comprobada, informada o pendiente; nunca deducida de un cliente genérico.
- Entrega con archivos cambiados, comandos/resultados, matriz normativa con fuentes del README, decisiones de tenancy, limitaciones y pendientes. Un pendiente bloqueante impide declarar terminado ese alcance.
- Sin commits, despliegues ni mutaciones de datos reales no autorizados; `git diff --check` limpio para archivos editados.
