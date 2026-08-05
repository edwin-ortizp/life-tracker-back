<?php

namespace Tests\Feature\Ui;

use App\Support\Ui\ComponentCatalog;
use Illuminate\Support\Facades\View;
use Tests\TestCase;

class UiCatalogTest extends TestCase
{
    public function test_the_catalog_is_available_in_development_and_testing(): void
    {
        $this->get('/ui-catalog')
            ->assertOk()
            ->assertSee('Catálogo del sistema de diseño')
            ->assertSee('Primitivos')
            ->assertSee('Patrones');
    }

    public function test_the_catalog_route_is_not_registered_outside_development_and_testing(): void
    {
        $routes = file_get_contents(base_path('routes/web.php'));

        $this->assertMatchesRegularExpression(
            "/if \(app\(\)->environment\(\['local', 'testing'\]\)\) \{/",
            $routes,
            'El catálogo debe registrarse solo en local y testing.',
        );

        $this->assertTrue(app('router')->has('ui.catalog'));

        // La misma definición evaluada en producción no registra ninguna ruta.
        $this->app['env'] = 'production';
        $router = new \Illuminate\Routing\Router(app('events'), app());

        \Illuminate\Support\Facades\Route::swap($router);

        require base_path('routes/web.php');

        $this->assertFalse($router->has('ui.catalog'), 'El catálogo no puede existir en producción.');
        $this->assertFalse($router->has('ui.catalog.show'));
    }

    public function test_every_canonical_component_is_documented_with_at_least_one_example(): void
    {
        foreach (ComponentCatalog::components() as $component) {
            $this->assertTrue(
                ComponentCatalog::has($component),
                "El componente canónico `{$component}` no está documentado en el catálogo.",
            );

            $partial = ComponentCatalog::examplePartial($component);

            $this->assertTrue(View::exists($partial), "Falta el ejemplo `{$partial}`.");

            $contents = file_get_contents(resource_path('views/'.str_replace('.', '/', $partial).'.blade.php'));

            $this->assertStringContainsString('<x-catalog.example', $contents, "El ejemplo de `{$component}` debe usar el bloque documentado.");
            $this->assertStringContainsString("<x-ui.{$component}", $contents, "El ejemplo de `{$component}` debe renderizar el componente real.");
            $this->assertNotEmpty(ComponentCatalog::entry($component)['usage'], "El componente `{$component}` debe documentar su uso.");
        }
    }

    public function test_the_catalog_does_not_document_components_that_no_longer_exist(): void
    {
        $components = ComponentCatalog::components();

        foreach (array_keys(ComponentCatalog::ENTRIES) as $documented) {
            $this->assertContains($documented, $components, "El catálogo documenta `{$documented}`, que ya no existe.");
        }
    }

    public function test_every_documented_component_renders_its_examples(): void
    {
        foreach (array_keys(ComponentCatalog::ENTRIES) as $component) {
            $response = $this->get("/ui-catalog/{$component}")->assertOk();

            $response->assertSee('data-component="'.$component.'"', false);
            $response->assertSee('md-catalog__demo', false);
        }
    }

    public function test_an_unknown_component_is_not_exposed(): void
    {
        $this->get('/ui-catalog/no-existe')->assertNotFound();
    }

    public function test_the_catalog_offers_navigation_and_usage_documentation(): void
    {
        $response = $this->get('/ui-catalog/action')->assertOk();

        $response->assertSee('Componentes del sistema', false)
            ->assertSee('aria-current="page"', false)
            ->assertSee('md-catalog__code', false)
            ->assertSee('Variantes de énfasis');
    }

    public function test_the_catalog_uses_deterministic_fixtures(): void
    {
        // Se compara la región de ejemplos: el documento incluye el token CSRF,
        // que cambia por petición y no forma parte de lo que muestra el catálogo.
        $examples = function (string $url): string {
            preg_match('/<div class="md-catalog__examples".*?<\/main>/s', $this->get($url)->getContent(), $matches);

            return $matches[0] ?? '';
        };

        $first = $examples('/ui-catalog/metric');
        $second = $examples('/ui-catalog/metric');

        $this->assertNotSame('', $first);
        $this->assertSame($first, $second, 'El catálogo debe renderizar siempre los mismos datos.');
        $this->assertStringContainsString('2350', $first);
    }

    public function test_the_catalog_shows_variants_states_long_content_and_missing_values(): void
    {
        $this->get('/ui-catalog/action')->assertSee('aria-busy="true"', false)->assertSee('disabled', false);
        $this->get('/ui-catalog/chip')->assertSee('aria-pressed="true"', false);
        $this->get('/ui-catalog/metric')->assertSee('—');
        $this->get('/ui-catalog/field')->assertSee(\App\Support\Ui\CatalogFixtures::LONG_TEXT);
        $this->get('/ui-catalog/state')->assertSee('data-state="filtered-empty"', false);
    }
}
