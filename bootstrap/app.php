<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Se resuelve antes que nada para que cualquier vista, incluidas las que
        // renderiza Livewire en sus peticiones de actualizacion, encuentre ya la
        // raiz de vistas moviles antepuesta.
        $middleware->prependToGroup('web', \App\Http\Middleware\DetectMobileClient::class);

        $middleware->alias([
            'integration.token' => \App\Http\Middleware\AuthenticateIntegrationToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
