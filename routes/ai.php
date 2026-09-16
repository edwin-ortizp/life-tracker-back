<?php

use App\Mcp\Servers\LifeTrackerServer;
use Illuminate\Support\Facades\Route;
use Laravel\Mcp\Facades\Mcp;

// Acepta los tokens de integración existentes (lt_ai_…) y los clientes OAuth.
Mcp::web('life-tracker', LifeTrackerServer::class)
    ->middleware(['mcp.auth', 'throttle:60,1']);

/*
 * Descubrimiento OAuth y registro dinámico de clientes (RFC 8414, 9728 y 7591),
 * que trae el propio laravel/mcp. El grupo no es decorativo: routes/ai.php se
 * carga sin middleware, así que sin él /oauth/register quedaría sin throttling.
 */
Route::middleware('throttle:20,1')->group(fn () => Mcp::oauthRoutes());
