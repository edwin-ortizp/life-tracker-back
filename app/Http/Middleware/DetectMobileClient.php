<?php

namespace App\Http\Middleware;

use App\Support\Device;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

/**
 * Antepone la raiz de vistas moviles cuando el cliente es un telefono.
 *
 * El resto de la aplicacion no se entera: `view('livewire.task.task-list')`
 * resuelve `resources/views-mobile/...` si ese archivo existe y cae en
 * `resources/views/...` si no. Eso incluye `layouts.app`, que ya declaran los
 * 54 componentes Livewire, asi que el marco movil se sirve sin tocar ni una
 * linea de PHP de los componentes ni de `routes/web.php`.
 */
class DetectMobileClient
{
    public function handle(Request $request, Closure $next): Response
    {
        $isMobile = Device::detect($request);

        app()->instance('device.mobile', $isMobile);
        View::share('isMobileClient', $isMobile);

        $mobilePath = resource_path('views-mobile');

        // Las rutas se fijan enteras en cada peticion en vez de anteponer una.
        // `prependLocation` muta el finder de forma permanente, asi que en un
        // proceso que atiende varias peticiones (Octane, la suite de tests) la
        // capa movil quedaria delante tambien para el siguiente cliente.
        $paths = array_values(array_filter(
            config('view.paths', []),
            fn (string $path) => realpath($path) !== realpath($mobilePath),
        ));

        if ($isMobile) {
            array_unshift($paths, $mobilePath);
        }

        // `flush` descarta ademas los nombres de vista ya resueltos, que se
        // cachean apuntando al archivo concreto del cliente anterior.
        View::getFinder()->setPaths($paths);
        View::getFinder()->flush();

        $response = $next($request);

        // La respuesta depende del User-Agent: sin esto una cache intermedia
        // podria servir el marco de escritorio a un telefono.
        $response->headers->set('Vary', 'User-Agent, Cookie');

        return $response;
    }
}
