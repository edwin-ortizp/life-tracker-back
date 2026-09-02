<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * La navegación del chrome de la aplicación no puede volver a ser una recarga
 * completa: cada tap descargaría otra vez el bundle entero, perdiendo el scroll
 * y provocando el parpadeo en blanco que hace que la app se sienta web.
 */
class SpaNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_application_chrome_navigates_without_reloading_the_page(): void
    {
        $user = User::factory()->create();

        $html = $this->actingAs($user)->get('/tasks/list')->assertOk()->getContent();

        foreach ([
            'sidebar' => 'lt-nav-item',
            'barra inferior' => 'lt-bottom__item',
            'pestañas de módulo' => 'lt-tab ',
        ] as $region => $marker) {
            $this->assertStringContainsString($marker, $html, "La región `{$region}` no aparece en la pantalla.");
        }

        // Cada enlace de navegación del marco declara `wire:navigate`.
        preg_match_all('/<a\b[^>]*class="[^"]*(?:lt-nav-item|lt-bottom__item|lt-tab|md-module-tab)[^"]*"[^>]*>/', $html, $matches);

        $this->assertNotEmpty($matches[0], 'No se encontró ningún enlace de navegación del marco.');

        foreach ($matches[0] as $anchor) {
            $this->assertStringContainsString(
                'wire:navigate',
                $anchor,
                'Un enlace de navegación del marco recarga la página entera: '.$anchor,
            );
        }
    }

    public function test_the_layout_does_not_depend_on_external_stylesheets_or_scripts(): void
    {
        $user = User::factory()->create();

        $html = $this->actingAs($user)->get('/')->assertOk()->getContent();

        // Las dependencias viajan en el bundle propio: un CDN añade DNS, TLS y
        // una ida y vuelta extra antes de poder pintar nada.
        $this->assertStringNotContainsString('cdn.jsdelivr.net', $html);
        $this->assertStringNotContainsString('fonts.bunny.net', $html);
        $this->assertStringNotContainsString('fonts.googleapis.com', $html);
    }
}
