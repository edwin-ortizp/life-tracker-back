<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Mcp\Enums\ProtocolVersion;
use Symfony\Component\HttpFoundation\Response;

class ValidateMcpTransport
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin');
        if ($origin !== null && ! in_array($origin, config('mcp.allowed_origins', []), true)) {
            return response()->json(['message' => 'Origen no permitido para el servidor MCP.'], 403);
        }

        $version = $request->header('MCP-Protocol-Version');
        if ($version !== null && ! in_array($version, ProtocolVersion::supported(), true)) {
            return response()->json(['message' => 'Versión de protocolo MCP no soportada.'], 400);
        }

        return $next($request);
    }
}
