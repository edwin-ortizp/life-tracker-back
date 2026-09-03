<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Contrato del marco de aplicacion.
 *
 * Hay un unico marco para todos los anchos: la respuesta no depende del
 * dispositivo que la pide, y el ancho del viewport es lo unico que decide que
 * chrome se ve. Lo que hace que la aplicacion se lea como app -- que se pueda
 * instalar y abrir sin barra de navegador, y que respete el notch y la barra de
 * gestos -- se sirve igual a todo el mundo.
 */
class AppShellTest extends TestCase
{
    use RefreshDatabase;

    private const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    private const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

    private function html(string $agent = self::WINDOWS, string $url = '/'): string
    {
        return $this->withHeader('User-Agent', $agent)
            ->actingAs(User::factory()->create())
            ->get($url)->assertOk()->getContent();
    }

    public function test_the_shell_does_not_change_with_the_user_agent(): void
    {
        // El contrato inverso al de la capa de vistas por dispositivo que hubo
        // aqui: un telefono y un escritorio reciben exactamente el mismo marco.
        $phone = $this->html(self::IPHONE);
        $desktop = $this->html(self::WINDOWS);

        foreach (['lt-sidebar', 'lt-bottom', 'lt-topbar'] as $region) {
            $this->assertStringContainsString($region, $phone, "Falta `{$region}` en la respuesta a un telefono.");
            $this->assertStringContainsString($region, $desktop, "Falta `{$region}` en la respuesta a un escritorio.");
        }
    }

    public function test_the_response_does_not_vary_by_user_agent(): void
    {
        // Sin `Vary: User-Agent` cualquier cache intermedia puede reutilizar la
        // misma respuesta para todos los clientes, que es justo lo que se busca.
        $this->withHeader('User-Agent', self::IPHONE)
            ->actingAs(User::factory()->create())
            ->get('/')
            ->assertOk()
            ->assertHeaderMissing('Vary');
    }

    public function test_the_shell_declares_everything_needed_to_run_as_an_installed_app(): void
    {
        $html = $this->html();

        foreach ([
            'viewport-fit=cover',
            'apple-mobile-web-app-capable',
            'apple-mobile-web-app-status-bar-style',
            'apple-touch-icon',
            'rel="manifest"',
            'name="color-scheme"',
        ] as $declaration) {
            $this->assertStringContainsString($declaration, $html, "Falta `{$declaration}` en el marco.");
        }
    }

    public function test_the_status_bar_colour_matches_the_manifest(): void
    {
        $manifest = json_decode(file_get_contents(public_path('manifest.json')), true);

        // Si difieren, la barra de estado cambia de tono al instalar la app.
        $this->assertStringContainsString(
            '<meta name="theme-color" content="'.$manifest['theme_color'].'">',
            $this->html(),
        );
    }

    public function test_the_shell_respects_the_device_safe_areas(): void
    {
        $css = file_get_contents(resource_path('css/m3/tokens/_tokens.css'));

        foreach (['--lt-safe-top', '--lt-safe-bottom'] as $token) {
            $this->assertStringContainsString($token.': env(safe-area-inset-', $css);
        }

        // Con `viewport-fit=cover` el contenido llega a los bordes, asi que el
        // marco tiene que devolver el notch y la barra de gestos explicitamente.
        $frame = file_get_contents(resource_path('css/m3/archetypes/_app-frame.css'));

        $this->assertStringContainsString('var(--lt-safe-bottom)', $frame);
        $this->assertStringContainsString('var(--lt-safe-top)', $frame);
    }

    public function test_the_chrome_decides_what_it_shows_in_css_and_not_in_javascript(): void
    {
        $layout = file_get_contents(resource_path('views/layouts/app.blade.php'));

        // La barra de destinos viaja siempre en el HTML: si su visibilidad
        // dependiera de una condicion de Alpine, parpadearia en cada carga.
        $this->assertStringNotContainsString('x-show="compact"', $layout);

        $frame = file_get_contents(resource_path('css/m3/archetypes/_app-frame.css'));

        $this->assertStringNotContainsString('lt-frame--compact', $frame, 'El breakpoint vuelve a estar duplicado en una clase de JavaScript.');
        $this->assertStringContainsString('@media (max-width: 767.98px)', $frame);
    }

    public function test_every_chrome_navigation_link_avoids_a_full_page_reload(): void
    {
        preg_match_all('/<a\b[^>]*class="[^"]*lt-(?:nav-item|bottom__item)[^"]*"[^>]*>/', $this->html(), $matches);

        $this->assertNotEmpty($matches[0]);

        foreach ($matches[0] as $anchor) {
            $this->assertStringContainsString('wire:navigate', $anchor, 'Enlace del marco sin `wire:navigate`: '.$anchor);
        }
    }
}
