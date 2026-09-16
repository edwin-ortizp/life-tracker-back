# Conectar ChatGPT o Claude por OAuth

LifeTracker es un **Authorization Server OAuth 2.1**, además de servir su propio servidor MCP.
Eso permite conectar la cuenta desde una herramienta externa sin pegar ningún token a mano: el
cliente descubre los endpoints, se registra solo, te lleva a una pantalla de consentimiento y
recibe un token que puedes revocar cuando quieras.

La URL a dar en la herramienta es la del servidor MCP: `<APP_URL>/life-tracker`.

## Qué expone la aplicación

| Endpoint | Para qué |
|---|---|
| `GET /.well-known/oauth-protected-resource` | Dice qué servidor autoriza este recurso (RFC 9728). Existe también la variante `/{path}`, que es la que anuncia el `401`. |
| `GET /.well-known/oauth-authorization-server` | Endpoints, scopes y métodos soportados (RFC 8414). |
| `POST /oauth/register` | Registro dinámico de clientes (RFC 7591). |
| `GET/POST /oauth/authorize` | Consentimiento del usuario. |
| `POST /oauth/token` | Canje del código y refresco. |

El flujo es `authorization_code` con **PKCE (S256)** y clientes públicos, sin `client_secret`.
Hay un solo scope, `mcp:use`, que da acceso al servidor MCP completo sobre los datos de ese
usuario. Los access tokens duran una hora y los refresh 30 días.

Todo esto lo aporta `laravel/mcp` (`Mcp::oauthRoutes()` en `routes/ai.php`) sobre Passport.

## Qué hace falta en el entorno

1. **Llaves de Passport**. `php artisan passport:keys` genera `storage/oauth-private.key` y
   `storage/oauth-public.key`. **No están en el repositorio** (las llaves privadas no se
   versionan) y sin ellas `POST /oauth/token` falla. En despliegues sin disco persistente,
   pásalas por entorno con `PASSPORT_PRIVATE_KEY` y `PASSPORT_PUBLIC_KEY`.
2. **Migraciones**: `php artisan migrate` crea las cinco tablas `oauth_*`.
3. **`APP_URL` correcta y con HTTPS**. De ella salen el `issuer` y todas las URLs de los
   documentos de descubrimiento; si está mal, el cliente no completa la conexión.

## Dominios de redirección permitidos

`config/mcp.php` trae una allowlist explícita en `redirect_domains` (el valor por defecto del
paquete es `'*'`, que dejaría a cualquiera registrar un cliente apuntando a donde quisiera).
Hoy admite `https://claude.ai`, `https://claude.com` y `https://chatgpt.com`, más los esquemas
privados `claude`, `cursor` y `vscode` de las apps de escritorio.

Si una herramienta legítima no consigue registrarse, `POST /oauth/register` responde `400` con
`error: invalid_redirect_uri`: mira en los logs qué URI intentó usar y añade su dominio a la
lista. Es el comportamiento buscado, no un fallo.

## Convivencia con los tokens actuales

El middleware `mcp.auth` (`app/Http/Middleware/AuthenticateMcpRequest.php`) acepta los dos
caminos: si el bearer empieza por un prefijo conocido (`lt_ob_`, `lt_cd_`, `lt_ai_`) sigue la
ruta de siempre; cualquier otro se resuelve como token OAuth y debe traer el scope `mcp:use`.
El token de **Ajustes → Integración con IA** sigue funcionando igual, y Obsidian y CalDAV no
se ven afectados.

## Revocar el acceso

**Ajustes → Aplicaciones conectadas** lista las herramientas conectadas por OAuth y permite
cortarles el acceso una a una. Revocar anula el token y su refresh, así que el corte es
inmediato.
