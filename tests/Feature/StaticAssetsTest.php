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

    public function test_service_worker_refreshes_application_assets_from_the_network(): void
    {
        $serviceWorker = file_get_contents(public_path('sw.js'));

        $this->assertStringContainsString("const CACHE_NAME = 'life-tracker-v2'", $serviceWorker);
        $this->assertStringContainsString('fetch(request).then((response) => {', $serviceWorker);
        $this->assertStringContainsString('.catch(() => caches.match(request))', $serviceWorker);
    }
}
