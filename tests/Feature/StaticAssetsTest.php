<?php

namespace Tests\Feature;

use Tests\TestCase;

class StaticAssetsTest extends TestCase
{
    public function test_login_uses_the_static_stylesheet_without_a_vite_manifest(): void
    {
        $this->assertFileExists(public_path('css/app.css'));

        $this->get('/login')
            ->assertOk()
            ->assertSee(asset('css/app.css'), false)
            ->assertDontSee('/build/assets/', false);
    }

    public function test_application_layout_uses_the_static_stylesheet_without_a_vite_manifest(): void
    {
        $html = view('layouts.app', ['slot' => 'Contenido'])->render();

        $this->assertStringContainsString(
            asset('css/app.css').'?v='.filemtime(public_path('css/app.css')),
            $html,
        );
        $this->assertStringContainsString(
            asset('js/app.js').'?v='.filemtime(public_path('js/app.js')),
            $html,
        );
        $this->assertStringNotContainsString('/build/assets/', $html);
    }

    /**
     * `public/build` esta en .gitignore y no se despliega. Si el CSS publicado
     * sigue apuntando ahi, las fuentes dan 404 en produccion y la aplicacion se
     * queda sin iconos, que es justo lo que paso al dejar de usar el CDN.
     */
    public function test_the_published_stylesheet_only_references_deployed_assets(): void
    {
        $css = file_get_contents(public_path('css/app.css'));

        $this->assertStringNotContainsString('/build/', $css);

        preg_match_all('#url\(([^)]+)\)#', $css, $matches);

        $referenced = collect($matches[1])
            ->map(fn (string $url) => trim($url, "\"' "))
            ->filter(fn (string $url) => str_starts_with($url, '/'))
            ->map(fn (string $url) => strtok($url, '?'))
            ->unique();

        $this->assertNotEmpty($referenced, 'El CSS publicado no referencia ningun asset.');

        foreach ($referenced as $url) {
            $this->assertFileExists(
                public_path(ltrim($url, '/')),
                "El CSS publicado referencia `{$url}`, que no existe en public/.",
            );
        }
    }

    public function test_the_service_worker_never_serves_a_stale_application_bundle(): void
    {
        $serviceWorker = file_get_contents(public_path('sw.js'));

        // El nombre de cache va versionado para invalidar despliegues anteriores.
        $this->assertMatchesRegularExpression("/const VERSION = 'life-tracker-v\d+'/", $serviceWorker);

        // `app.js` y `app.css` contienen Livewire: servir una copia caducada
        // dejaria la aplicacion sin interactividad tras un despliegue.
        $this->assertStringContainsString('handleVersionedBundle', $serviceWorker);
        $this->assertStringContainsString("url.pathname === '/js/app.js'", $serviceWorker);

        // Las peticiones de Livewire nunca se cachean.
        $this->assertStringContainsString("url.pathname.startsWith('/livewire')", $serviceWorker);

        // Las dependencias externas se auto-hospedan: precachear un CDN volveria
        // a atar el arranque sin conexion a un tercero.
        $this->assertStringNotContainsString('cdn.jsdelivr.net', $serviceWorker);
        $this->assertStringNotContainsString('fonts.bunny.net', $serviceWorker);
    }

    public function test_the_service_worker_is_actually_registered(): void
    {
        // Existia desde hacia tiempo pero no lo registraba nadie, asi que la
        // aplicacion nunca llego a comportarse como una PWA.
        $this->assertStringContainsString(
            "navigator.serviceWorker.register('/sw.js')",
            file_get_contents(resource_path('js/pwa.js')),
        );
    }

    public function test_the_offline_fallback_is_reachable_without_a_session(): void
    {
        $this->get('/offline')->assertOk()->assertSee('Sin conexión');
    }
}
