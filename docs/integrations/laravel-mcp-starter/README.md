# MCP con OAuth en un monolito Laravel

Guía portable, revisada el 11 de octubre de 2026. Puede copiarse completa a otro repositorio sin disponer del código de Life Tracker. Empieza aquí, sigue [VALIDATION.md](VALIDATION.md) y entrega [CODEX-PROMPT.md](CODEX-PROMPT.md) al agente que implementará la integración.

## Alcance y responsabilidades

Cada aplicación publica un servidor MCP remoto y actúa como servidor de autorización OAuth mediante Passport. Codex, Claude, Grok y otros consumidores son los clientes OAuth. La aplicación no necesita convertirse en cliente OAuth de esos productos.

El módulo vive dentro del monolito: comparte despliegue, proceso, base de datos y servicios de negocio. Concentrar archivos facilita mantenerlo, pero no proporciona aislamiento de proceso ni una fuente única entre repositorios. Compartir código automáticamente exigiría posteriormente un paquete Composer con contratos y pruebas propios.

```text
app/Mcp/
  Servers/ApplicationServer.php
  Tools/<Dominio>/
  Auth/                         # Middleware y resolución de identidad
  Authorization/                # Adaptación a Policies/Gates existentes
  Support/                      # Transporte, metadatos, serialización
  Providers/McpServiceProvider.php
config/mcp.php                  # Configuración pública del módulo
routes/ai.php                   # Registro MCP y OAuth
resources/views/mcp/             # Consentimiento y conexiones, si corresponde
tests/Feature/Mcp/              # OAuth, transporte, permisos y aislamiento
```

Esta es una organización propuesta; conserva convenciones equivalentes del proyecto. Los puntos fuera de `app/Mcp` son deliberados: registro del provider y middleware en el bootstrap vigente, guard/provider en `config/auth.php`, configuración Passport, vistas, rutas y migraciones OAuth. Documenta cada punto; evita modificar `vendor`.

Las herramientas validan entradas, autorizan y llaman servicios existentes. No trasladar controladores completos ni duplicar reglas de negocio. Los servicios deben recibir una identidad/contexto autorizado o aplicar sus propias políticas; el módulo no puede ser una vía alternativa para eludirlas.

## 1. Inventariar antes de instalar

Inspecciona `AGENTS.md`, `composer.json`, `composer.lock`, versiones realmente instaladas, PHP, rutas, bootstrap/providers, guards, modelo(s) de usuario, Policies/Gates, permisos, tenancy y APIs existentes. Identifica colisiones de rutas OAuth, tablas y traits. Registra el resultado y las versiones del protocolo que soporta el transporte instalado.

Referencia histórica de Life Tracker: restricciones PHP `^8.3`, Laravel `^13.8`; suite final de la revisión con Laravel MCP **0.9.4** y Passport **13.8.0**. Son antecedentes probados, no versiones mínimas ni una recomendación de fijarlas para siempre. El árbol instalado inicialmente difería del lock; verifica ambos antes de interpretar resultados.

Paquetes: `laravel/mcp` para transporte y herramientas; `laravel/passport` para autorización y tokens. Consulta las instrucciones correspondientes a la versión compatible con el proyecto. Después de resolver compatibilidad, los comandos de referencia son:

```shell
composer require laravel/mcp laravel/passport
php artisan vendor:publish --tag=ai-routes
php artisan make:mcp-server ApplicationServer
php artisan make:mcp-tool ListRecordsTool
```

No ejecutar instalaciones genéricas de API ni publicadores con `--force` sobre configuración existente. Inspecciona los archivos generados y los cambios del lock. Integra las migraciones de Passport conforme a su versión; comprueba tipos de identificadores y conexión de base de datos antes de ejecutarlas. No actualizar dependencias ajenas como parte de esta integración.

## 2. Identidad, scopes y permisos

La autorización efectiva es la intersección de **token válido + scopes concedidos + permisos actuales del usuario + acceso al registro y contexto organizacional**. `mcp:use` permite usar la integración; no concede administración ni acceso a todos los datos.

Define una matriz por herramienta: operación, scope, Policy/Gate, restricciones de registro/tenant, campos de entrada y salida. Puedes comenzar con `mcp:use` y conservar toda la autorización funcional en Policies. Si necesitas consentimiento separado para lectura y escritura, define scopes adicionales y aplícalos tanto al catálogo como a la ejecución; no basta con anunciarlos.

El guard Passport del módulo debe usar el provider correcto sin sustituir el guard de APIs existentes. Cada petición autenticada establece de forma coherente el usuario del request y el contexto que consumen Gates y servicios. Rechaza usuarios deshabilitados o sin contexto válido conforme a las reglas del producto. No confiar en scopes Eloquent que dejan de filtrar sin usuario autenticado.

Filtra `tools/list` con las capacidades actuales del usuario mediante el mecanismo de registro condicional disponible en la versión instalada. Reautoriza siempre `tools/call`, incluso si el cliente conserva un catálogo antiguo. Al retirar un permiso, las llamadas siguientes deben denegarse; invalida también las cachés de permisos que lo impidan.

### Ejemplo adaptable de dominio

Este pseudocódigo representa dos herramientas, no clases listas para pegar. `Record`, `RecordService`, `visibleTo` y las abilities son contratos de ejemplo que deben sustituirse por los existentes. El servidor adapta el resultado al `Response` y el esquema de Laravel MCP de su versión.

```php
// list-records: sin user_id ni tenant_id seleccionables por el cliente.
$context = $verifiedContextResolver->fromAuthenticatedRequest($request);
$user = $context->user;
Gate::forUser($user)->authorize('viewAny', Record::class);
$records = $recordService->listVisible($context, $validatedFilters);
return $serializer->publicRecordList($records);

// update-record: buscar solamente dentro del contexto ya verificado.
$record = $recordService->findVisibleOrFail($context, $validatedId);
Gate::forUser($user)->authorize('update', $record);
$updated = $recordService->update($context, $record, $validatedChanges);
return $serializer->publicRecord($updated);
```

`listVisible`/`findVisibleOrFail` deben aplicar restricciones de usuario y organización, incluso para administradores según sus permisos reales. No usar `find($id)` global seguido de una comprobación superficial de rol. Un administrador autorizado puede modificar; un usuario con permiso de lectura puede listar registros visibles y debe ser rechazado al modificar, también mediante llamada directa. No asumir que todos los administradores pueden cruzar tenants.

Define esquemas de entrada de tipo objeto, filtros y límites; valida los argumentos antes de usarlos, controla campos modificables y serializa explícitamente las salidas para excluir secretos. Los errores de herramienta deben usar el contrato MCP de la versión instalada, sin trazas internas. Una entrada `user_id` o `tenant_id` nunca cambia la identidad: si una operación administrativa necesita seleccionar un destinatario, autoriza ese acceso explícitamente dentro del contexto permitido.

## 3. Integrar OAuth y el transporte

1. Configura el guard Passport, scopes y tiempos de vida en el provider del módulo. Life Tracker usó access tokens de una hora y refresh de 30 días; decide los plazos del producto y prueba la revocación. No habilitar password grant como atajo.
2. Registra el endpoint MCP y el descubrimiento OAuth del paquete. El patrón de rutas es el siguiente; las clases de middleware son contratos a implementar/verificar, no clases incluidas en esta carpeta:

   ```php
   use App\Mcp\Servers\ApplicationServer;
   use App\Mcp\Auth\AuthenticateMcpRequest;
   use App\Mcp\Support\ValidateMcpTransport;
   use Laravel\Mcp\Facades\Mcp;
   use Illuminate\Support\Facades\Route;

   Route::middleware(ValidateMcpTransport::class)->group(function () {
       Mcp::web('mcp', ApplicationServer::class)
           ->middleware([AuthenticateMcpRequest::class, 'throttle:60,1']);
   });
   Route::middleware('throttle:20,1')->group(fn () => Mcp::oauthRoutes());
   ```

   Las cuotas son ejemplos, no requisitos del protocolo. Verifica `route:list`, orden de middleware y carga única de `routes/ai.php`. No suponer que hereda el grupo `web`. Conserva sesión/autenticación web y CSRF del consentimiento; el POST MCP autenticado por token no debe redirigir al login ni requerir una sesión web. No desactivar CSRF globalmente.
3. Proporciona consentimiento con cliente, scopes y cuenta/contexto claramente visibles, aceptar/rechazar y protección contra solicitudes falsificadas. Requiere authorization code con PKCE **S256** para clientes públicos, código de un uso y redirect registrado comparado conforme a OAuth. Prueba rechazo del verificador incorrecto y del redirect cambiado.
4. Expón metadatos del recurso protegido y del servidor de autorización coherentes con las rutas reales. Incluye `resource_metadata` en el challenge de autenticación. Para `/mcp`, comprueba la variante `/.well-known/oauth-protected-resource/mcp`; no sustituirla por una raíz que identifique otro recurso.
5. Decide registro de clientes según especificación soportada y clientes objetivo. Life Tracker utilizó DCR (`POST /oauth/register`) con clientes públicos `none`. Verifica que los métodos de autenticación anunciados coincidan con los aceptados; no copiar `none/basic/post` si el servidor destino no soporta los tres. No anunciar CIMD sin implementarlo, ni copiar DCR como única estrategia futura.
6. Valida token, caducidad, revocación, scopes y destinatario del recurso antes de despachar. **Pendiente de referencia:** Life Tracker no completó la verificación dirigida de `resource`/audiencia RFC 8707; no copiar esa laguna como solución. Un `aud` que contiene `client_id` no demuestra vinculación al recurso MCP. Comprueba emisión y rechazo de tokens para otros recursos/servidores y documenta cualquier limitación antes de declarar aceptación de seguridad.
7. Añade gestión de conexiones del propio usuario y revocación del access token y sus refresh asociados. Un usuario no puede consultar ni revocar conexiones ajenas. Cerrar la sesión web no equivale a revocar OAuth.

Bearer manual solo si hay integraciones existentes que conservar. OAuth también envía el access token como `Authorization: Bearer`; la diferencia es cómo se obtiene y gestiona. Si conviven credenciales heredadas, mantén validadores separados y una selección inequívoca, sin convertir un OAuth inválido en acceso alternativo. No copies los prefijos particulares de Life Tracker.

## 4. Claves, HTTPS y callbacks

Passport necesita un par RSA persistente. Puede cargar archivos `storage/oauth-private.key` y `storage/oauth-public.key` o claves PEM configuradas mediante `PASSPORT_PRIVATE_KEY`/`PASSPORT_PUBLIC_KEY`, según la configuración de la versión. Variables vacías no implican fallo si existen archivos válidos. Comprueba configuración efectiva, permisos, correspondencia del par y persistencia sin imprimir su contenido.

Solo si se confirma que nunca hubo claves, `php artisan passport:keys` permite generarlas. Restaura las existentes cuando corresponda; no usar `--force` como reparación automática. Reemplazarlas invalida tokens firmados previamente. No versionar claves ni reutilizar las de producción en pruebas. `APP_KEY` no sustituye estas claves.

Configura `APP_URL` HTTPS, proxies de confianza y generación de URLs conforme al despliegue real; evita redirecciones que pierdan `Authorization`. Tras cambios de entorno aplica el procedimiento de caché de configuración del proyecto y verifica metadatos desde fuera. No confiar en valores `.env` leídos directamente cuando Laravel usa configuración cacheada.

Mantén separadas estas listas:

| Configuración | Propósito | Criterio |
|---|---|---|
| Redirects OAuth | Adónde vuelve el navegador con el código | URI registrada y validada; dominios/esquemas autorizados por evidencia |
| Origin HTTP | Desde qué origen procede una solicitud MCP | Validación explícita si existe; no derivarla de los callbacks |
| Proxies de confianza | Interpretar host/protocolo del despliegue | Solo infraestructura realmente confiable |

Grok falló en Life Tracker al registrar `https://grok.com/connectors-oauth-exchange-code/`: se corrigió su dominio tras capturar `invalid_redirect_uri`. Codex de escritorio necesitó callback HTTP loopback con puerto variable: permitir loopback según RFC 8252 no cambia la URL HTTPS pública del servidor. En MCP 0.9.4, la entrada `http://127.0.0.1` habilitaba las variantes loopback contempladas por su validador; no asumas esa semántica en otra versión. Prueba hosts parecidos maliciosos y comparación del redirect en el canje. No permitir `*` ni todos los esquemas para hacer funcionar un cliente.

## 5. Adaptaciones de proyectos

**CertMind:** la inspección de referencia encontró Sanctum y Entrust. Confirma el estado vigente antes de implementar. Passport y Sanctum tienen traits `HasApiTokens` con métodos en conflicto; no añadir ambos sin resolver contratos, ni sustituir el trait/guard que usan APIs actuales. Evalúa un modelo/provider específico para OAuth o una adaptación explícita de contratos y resolución de métodos, con pruebas de ambos sistemas. Reutiliza las reglas Entrust/Policies existentes y sus cachés; no inventar nombres de permisos. Social login y emisión de tokens OAuth para MCP tienen responsabilidades diferentes.

**Gesthor:** inspecciona tenancy, usuarios centrales y usuarios tenant; define dónde se almacenan clientes, códigos, tokens y refresh. Documenta un recorrido único de contexto para descubrimiento → registro → sesión/consentimiento → emisión → llamada MCP → revocación. Si el issuer es central y el recurso tenant, diseña y valida la vinculación explícita; si el issuer es tenant, valida resolución y conexión de base de datos en todos los endpoints. No ejecutar consultas OAuth en una conexión elegida por un `tenant_id` no verificado. Rechaza contexto ambiguo, membership retirado y cambios de host no autorizados. Prueba también usuarios con el mismo identificador en tenants distintos.

## 6. Aprendizajes y límites de la referencia

En Life Tracker se reprodujeron y corrigieron metadatos inconsistentes de autenticación, `401` para scope insuficiente, negociación de versión desconocida, falta de validación de versión HTTP/Origin y callbacks legítimos rechazados. Revisa primero si tu dependencia ya resuelve cada caso; no copies overrides ni middleware duplicados.

Para las revisiones soportadas en aquella revisión, `initialize` con versión desconocida debía proponer una soportada; una cabecera `MCP-Protocol-Version` no soportada recibía `400`. GET sin stream independiente podía responder `405`. Estos comportamientos se contrastan con la revisión realmente anunciada: no añadir SSE legado o anunciar una revisión nueva sin implementar sus requisitos. Recorre todas las páginas de `tools/list` mediante `nextCursor`.

Evidencia histórica: suite local OAuth/MCP de 173 pruebas y 1120 aserciones; luego pruebas enfocadas de callbacks, 9 pruebas y 25 aserciones. Son resultados de Life Tracker, no pruebas de este starter ni de los proyectos destino. Hubo comprobaciones HTTP públicas sin credenciales. Grok y, posteriormente, el funcionamiento general fueron informados por el usuario; eso no acredita una ejecución independiente desde cada producto. No se presenta esta implementación como certificación íntegra MCP/OAuth; la audiencia/recurso quedó pendiente de análisis dirigido.

## Fuentes oficiales y mantenimiento

Fecha de referencia: 2026-10-11. Las páginas de producto y `latest` cambian: registra fecha, revisión y versiones en cada implementación. Las fuentes Laravel explican las APIs del paquete; los ejemplos y decisiones de organización de esta guía son propios.

- [Laravel MCP](https://laravel.com/docs/13.x/mcp) y [Passport](https://laravel.com/docs/13.x/passport): instalación y APIs; seleccionar la documentación correspondiente al destino.
- [MCP autorización 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization), [transporte](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports), [ciclo de vida](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle), [herramientas](https://modelcontextprotocol.io/specification/2025-11-25/server/tools). Contrastar con [revisión vigente](https://modelcontextprotocol.io/specification/latest) sin atribuirla automáticamente a un paquete anterior.
- [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414.html): metadatos del AS; omitir métodos implica `client_secret_basic`.
- [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728.html): metadatos del recurso; [RFC 7591](https://www.rfc-editor.org/rfc/rfc7591.html): DCR.
- [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html): PKCE; [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html): aplicaciones nativas y loopback.
- [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html): Bearer y errores; [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html): resource; [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html): prácticas de seguridad OAuth.
- [Codex MCP](https://developers.openai.com/codex/extend/mcp), [ChatGPT MCP](https://developers.openai.com/api/docs/guides/custom-mcp-server), [Claude conectores](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp), [Grok conectores](https://docs.x.ai/grok/connectors). La [API remota xAI](https://docs.x.ai/developers/tools/remote-mcp) es otra superficie y no acredita grok.com.

En la matriz del proyecto destino distingue MUST, SHOULD y MAY con sección y revisión exactas. Las recomendaciones organizativas de esta guía no son requisitos normativos. La guía no sustituye las pruebas de [VALIDATION.md](VALIDATION.md).
