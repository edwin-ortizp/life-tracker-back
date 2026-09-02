<?php

namespace Tests\Feature;

use App\Http\Middleware\DetectMobileClient;
use App\Support\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Contrato de la capa de vistas movil.
 *
 * Una pantalla con variante movil se sirve desde `resources/views-mobile`; una
 * sin variante cae en la de escritorio sin declarar nada. La deteccion vive en
 * servidor para que sea identica en el `mount` y en cada `update` de Livewire.
 */
class MobileViewLayerTest extends TestCase
{
    private const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    private const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['web', DetectMobileClient::class])->get('/__contract-probe', fn () => view('testing.view-layer-probe'));
        Route::middleware(['web', DetectMobileClient::class])->get('/__contract-missing', fn () => view('layouts.app', ['slot' => '']));
    }

    public function test_a_phone_is_served_the_mobile_view(): void
    {
        $this->withHeader('User-Agent', self::IPHONE)
            ->get('/__contract-probe')
            ->assertOk()
            ->assertSee('capa-movil');
    }

    public function test_a_desktop_browser_is_served_the_desktop_view(): void
    {
        $this->withHeader('User-Agent', self::DESKTOP)
            ->get('/__contract-probe')
            ->assertOk()
            ->assertSee('capa-escritorio');
    }

    public function test_the_cookie_overrides_the_user_agent_in_both_directions(): void
    {
        $this->withHeader('User-Agent', self::IPHONE)
            ->withUnencryptedCookie(Device::COOKIE, Device::DESKTOP)
            ->get('/__contract-probe')
            ->assertSee('capa-escritorio');

        $this->withHeader('User-Agent', self::DESKTOP)
            ->withUnencryptedCookie(Device::COOKIE, Device::MOBILE)
            ->get('/__contract-probe')
            ->assertSee('capa-movil');
    }

    public function test_a_screen_without_a_mobile_variant_falls_back_to_the_desktop_one(): void
    {
        // `layouts.app` solo existe en `resources/views` mientras no se escriba
        // su variante movil, y aun asi la peticion movil se resuelve.
        $this->withHeader('User-Agent', self::IPHONE)
            ->get('/__contract-missing')
            ->assertOk();
    }

    public function test_the_response_varies_by_user_agent_and_cookie(): void
    {
        $vary = $this->withHeader('User-Agent', self::IPHONE)
            ->get('/__contract-probe')
            ->headers->get('Vary');

        $this->assertStringContainsString('User-Agent', $vary);
        $this->assertStringContainsString('Cookie', $vary);
    }

    public function test_tablets_and_desktops_are_not_treated_as_phones(): void
    {
        foreach ([
            'iPad' => 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Safari/604.1',
            'Android tablet' => 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
            'escritorio' => self::DESKTOP,
            'sin agente' => '',
        ] as $label => $agent) {
            $this->assertFalse(Device::looksLikeAPhone($agent), "`{$label}` no debe resolverse como telefono.");
        }
    }

    public function test_phones_are_detected(): void
    {
        foreach ([
            'iPhone' => self::IPHONE,
            'Android' => 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
        ] as $label => $agent) {
            $this->assertTrue(Device::looksLikeAPhone($agent), "`{$label}` debe resolverse como telefono.");
        }
    }

    public function test_the_detection_is_available_to_the_application(): void
    {
        $middleware = new DetectMobileClient;
        $request = Request::create('/', 'GET', server: ['HTTP_USER_AGENT' => self::IPHONE]);

        $middleware->handle($request, fn () => response('ok'));

        $this->assertTrue(Device::isMobile());
    }
}
