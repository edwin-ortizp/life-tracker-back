<?php

namespace App\Http\Middleware;

use App\Models\IntegrationToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Server\Registrar;
use Symfony\Component\HttpFoundation\Response;

/**
 * Autentica el servidor MCP por dos caminos.
 *
 * Los tokens de integración (lt_ai_…) siguen funcionando como siempre; cualquier
 * otro bearer se resuelve como token OAuth de Passport y debe traer el scope
 * «mcp:use». Así conectar por OAuth no rompe la conexión actual.
 *
 * En ambos casos termina en Auth::setUser(): el trait BelongsToUser filtra por
 * auth()->id() contra el guard por defecto, así que sin esto el aislamiento por
 * usuario no se aplicaría.
 */
class AuthenticateMcpRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return $this->unauthorized();
        }

        if ($this->isIntegrationToken($token)) {
            return app(AuthenticateIntegrationToken::class)->handle($request, $next);
        }

        $user = $request->user('api');

        if (! $user) {
            return $this->unauthorized();
        }

        if (! $request->user('api')->tokenCan(Registrar::OAUTH_SCOPE)) {
            return $this->unauthorized('El token no tiene permiso para usar el servidor MCP.');
        }

        Auth::setUser($user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }

    private function isIntegrationToken(string $token): bool
    {
        $prefixes = [
            IntegrationToken::PREFIX,
            IntegrationToken::CALDAV_PREFIX,
            IntegrationToken::AI_PREFIX,
        ];

        foreach ($prefixes as $prefix) {
            if (str_starts_with($token, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /** El 401 lo completa AddWwwAuthenticateHeader, que ya envuelve la ruta MCP. */
    private function unauthorized(string $message = 'Autenticación requerida para el servidor MCP.'): Response
    {
        return response()->json(['message' => $message], 401);
    }
}
