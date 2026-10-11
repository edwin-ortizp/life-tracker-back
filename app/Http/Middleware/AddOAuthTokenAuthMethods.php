<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddOAuthTokenAuthMethods
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($response instanceof JsonResponse && $response->isSuccessful()
            && $request->routeIs('mcp.oauth.authorization-server', 'mcp.oauth.authorization-server.nested')) {
            $response->setData([
                ...$response->getData(true),
                // Passport accepts public PKCE clients and confidential clients.
                'token_endpoint_auth_methods_supported' => ['none', 'client_secret_basic', 'client_secret_post'],
            ]);
        }

        return $response;
    }
}
