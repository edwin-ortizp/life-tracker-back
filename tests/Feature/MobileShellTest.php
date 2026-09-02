<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Contrato del marco movil.
 *
 * Lo que hace que la aplicacion se lea como app y no como web vive aqui: que se
 * pueda instalar y abrir sin barra de navegador, que respete el notch y la barra
 * de gestos, y que la navegacion inferior no se repinte en cada pantalla.
 */
class MobileShellTest extends TestCase
{
    use RefreshDatabase;

    private const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    private function phone(): self
    {
        return $this->withHeader('User-Agent', self::IPHONE);
    }

    private function mobileHtml(string $url = '/'): string
    {
        return $this->phone()->actingAs(User::factory()->create())->get($url)->assertOk()->getContent();
    }

    public function test_a_phone_gets_the_mobile_shell_and_a_desktop_does_not(): void
    {
        $this->assertStringContainsString('lt-m-tabs', $this->mobileHtml());

        $desktop = $this->withHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')
            ->actingAs(User::factory()->create())->get('/')->assertOk()->getContent();

        $this->assertStringNotContainsString('lt-m-tabs', $desktop);
        $this->assertStringContainsString('lt-sidebar', $desktop);
    }

    public function test_the_shell_declares_everything_needed_to_run_as_an_installed_app(): void
    {
        $html = $this->mobileHtml();

        foreach ([
            'viewport-fit=cover',
            'apple-mobile-web-app-capable',
            'apple-mobile-web-app-status-bar-style',
            'apple-touch-icon',
            'rel="manifest"',
            'name="color-scheme"',
        ] as $declaration) {
            $this->assertStringContainsString($declaration, $html, "Falta `{$declaration}` en el marco movil.");
        }
    }

    public function test_the_status_bar_colour_matches_the_manifest(): void
    {
        $manifest = json_decode(file_get_contents(public_path('manifest.json')), true);

        // Si difieren, la barra de estado cambia de tono al instalar la app.
        $this->assertStringContainsString(
            '<meta name="theme-color" content="'.$manifest['theme_color'].'">',
            $this->mobileHtml(),
        );
    }

    public function test_the_shell_respects_the_device_safe_areas(): void
    {
        $css = file_get_contents(resource_path('css/m3/tokens/_tokens.css'));

        foreach (['--lt-safe-top', '--lt-safe-bottom'] as $token) {
            $this->assertStringContainsString($token.': env(safe-area-inset-', $css);
        }

        $frame = file_get_contents(resource_path('css/m3/archetypes/_mobile-frame.css'));

        $this->assertStringContainsString('var(--lt-safe-bottom)', $frame);
        $this->assertStringContainsString('var(--lt-safe-top)', $frame);
    }

    public function test_the_tab_bar_survives_navigation_and_resolves_its_active_state_on_the_client(): void
    {
        $html = $this->mobileHtml();

        // Persistida: Livewire no la vuelve a pintar al navegar.
        $this->assertStringContainsString('mobile-tabs', $html);

        // Y por eso el estado activo no puede venir cocido del servidor.
        $this->assertStringContainsString('data-lt-match', $html);
        $this->assertStringContainsString('isActive($el)', $html);
    }

    public function test_the_mobile_shell_does_not_ship_the_desktop_sidebar(): void
    {
        $html = $this->mobileHtml();

        // El sidebar de escritorio emite las 51 entradas de navegacion en cada
        // pantalla. En movil los modulos viven en una hoja bajo demanda.
        $this->assertStringNotContainsString('lt-sidebar__scroll', $html);
        $this->assertStringContainsString('lt-m-sheet', $html);
    }

    public function test_every_mobile_navigation_link_avoids_a_full_page_reload(): void
    {
        preg_match_all('/<a\b[^>]*class="[^"]*lt-m-[^"]*"[^>]*>/', $this->mobileHtml(), $matches);

        $this->assertNotEmpty($matches[0]);

        foreach ($matches[0] as $anchor) {
            $this->assertStringContainsString('wire:navigate', $anchor, 'Enlace del marco movil sin `wire:navigate`: '.$anchor);
        }
    }
}
