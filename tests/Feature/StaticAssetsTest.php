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

        $this->assertStringContainsString(asset('css/app.css'), $html);
        $this->assertStringNotContainsString('/build/assets/', $html);
    }
}
