<?php

namespace App\Http\Middleware;

use App\Models\IntegrationToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateIntegrationToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainTextToken = $request->bearerToken();

        if (!$plainTextToken || !str_starts_with($plainTextToken, IntegrationToken::PREFIX)) {
            return response()->json(['message' => 'Token de integración no válido.'], 401);
        }

        $token = IntegrationToken::query()
            ->with('user')
            ->where('token_hash', hash('sha256', $plainTextToken))
            ->whereNull('revoked_at')
            ->first();

        if (!$token || !$token->user) {
            return response()->json(['message' => 'Token de integración no válido.'], 401);
        }

        $token->forceFill(['last_used_at' => now()])->save();

        Auth::setUser($token->user);
        $request->setUserResolver(fn () => $token->user);

        return $next($request);
    }
}
