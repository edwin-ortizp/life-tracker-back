<?php

namespace Tests\Feature\Ui;

use App\Models\User;
use App\Support\Ui\ScreenArchetype;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ProtectedScreenContractTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Rutas de página completa que no pueden resolverse sin un registro concreto.
     */
    private const PARAMETERISED = ['vehicles.show', 'vehicles.fuel', 'vehicles.maintenance', 'relationships.show', 'goals.show', 'journal.life.week'];

    /**
     * @return list<string>
     */
    private function screens(): array
    {
        $urls = [];

        foreach (Route::getRoutes() as $route) {
            if (! in_array('GET', $route->methods(), true)) {
                continue;
            }

            if (! in_array('auth', $route->gatherMiddleware(), true)) {
                continue;
            }

            if (in_array($route->getName(), self::PARAMETERISED, true) || str_contains($route->uri(), '{')) {
                continue;
            }

            $urls[] = '/'.ltrim($route->uri(), '/');
        }

        return array_values(array_unique($urls));
    }

    public function test_every_protected_screen_renders_one_shell_with_a_declared_archetype(): void
    {
        $user = User::factory()->create();
        $problems = [];

        foreach ($this->screens() as $url) {
            $response = $this->actingAs($user)->get($url);

            if ($response->isRedirect()) {
                continue;
            }

            if ($response->status() !== 200) {
                $problems[] = "{$url}: respondió {$response->status()}";

                continue;
            }

            $html = $response->getContent();

            if (substr_count($html, 'md-module-shell') === 0) {
                $problems[] = "{$url}: no usa el shell compartido";
            }

            if (substr_count($html, '<h1') !== 1) {
                $problems[] = "{$url}: debe renderizar exactamente un encabezado de módulo";
            }

            if (! preg_match('/data-archetype="([\w-]+)"/', $html, $matches)) {
                $problems[] = "{$url}: no declara arquetipo";

                continue;
            }

            if (! in_array($matches[1], ScreenArchetype::ALL, true)) {
                $problems[] = "{$url}: declara el arquetipo no aprobado {$matches[1]}";
            }

            if (! str_contains($html, 'data-archetype-source="declared"')) {
                $problems[] = "{$url}: hereda el arquetipo de reserva en vez de declararlo";
            }
        }

        $this->assertSame([], $problems, 'Pantallas fuera del contrato:'.PHP_EOL.implode(PHP_EOL, $problems));
    }

    public function test_no_protected_screen_shows_more_than_one_dominant_action(): void
    {
        $user = User::factory()->create();
        $problems = [];

        foreach ($this->screens() as $url) {
            $response = $this->actingAs($user)->get($url);

            if ($response->isRedirect() || $response->status() !== 200) {
                continue;
            }

            $html = $response->getContent();

            if (! preg_match('/data-region="actions"(.*?)<\/header>/s', $html, $matches)) {
                continue;
            }

            // El espejo móvil repite la acción principal; solo una es visible a la vez.
            $desktop = explode('md-responsive-actions__mobile', $matches[1])[0];
            $dominant = substr_count($desktop, 'md-btn-filled');

            if ($dominant > 1) {
                $problems[] = "{$url}: {$dominant} acciones dominantes en el encabezado";
            }
        }

        $this->assertSame([], $problems, 'Jerarquía de acciones incoherente:'.PHP_EOL.implode(PHP_EOL, $problems));
    }
}
