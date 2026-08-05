<?php

namespace Tests\Feature\Ui;

use App\Support\Ui\ConformanceBaseline;
use App\Support\Ui\CssLayerAnalyzer;
use Tests\TestCase;

class CssLayerContractTest extends TestCase
{
    private function analyzer(): CssLayerAnalyzer
    {
        return new CssLayerAnalyzer;
    }

    public function test_every_layer_directory_exists_and_is_imported_in_order(): void
    {
        $entry = file_get_contents(base_path('resources/css/app.css'));
        $position = -1;

        foreach (CssLayerAnalyzer::LAYERS as $layer) {
            $this->assertDirectoryExists(base_path("resources/css/m3/{$layer}"));

            $found = strpos($entry, "./m3/{$layer}/");

            $this->assertIsInt($found, "La capa {$layer} debe importarse desde app.css.");
            $this->assertGreaterThan($position, $found, "La capa {$layer} debe importarse después de la capa anterior.");
            $position = $found;
        }
    }

    public function test_every_layer_file_is_imported_by_the_entry_point(): void
    {
        $entry = file_get_contents(base_path('resources/css/app.css'));

        foreach ($this->analyzer()->files() as $layer => $files) {
            foreach ($files as $file) {
                $name = basename($file);

                $this->assertStringContainsString("./m3/{$layer}/{$name}", $entry, "{$layer}/{$name} no está importado.");
            }
        }
    }

    public function test_no_layer_depends_on_a_later_layer(): void
    {
        $forward = array_values(array_filter(
            $this->analyzer()->violations(),
            fn (array $violation) => $violation['kind'] === 'forward-dependency',
        ));

        $messages = array_map(
            fn (array $violation) => "{$violation['file']}: `{$violation['selector']}` usa .{$violation['class']} de la capa {$violation['owner']}",
            $forward,
        );

        $this->assertSame([], $forward, 'Una capa depende de otra posterior:'.PHP_EOL.implode(PHP_EOL, $messages));
    }

    public function test_module_styles_do_not_add_overrides_of_base_selectors(): void
    {
        $baseline = ConformanceBaseline::load(base_path(config('ui-conformance.layer_baseline')));

        $grouped = [];

        foreach ($this->analyzer()->violations() as $violation) {
            if ($violation['kind'] !== 'base-selector-override') {
                continue;
            }

            $grouped[$violation['file']][] = $violation;
        }

        $messages = [];

        foreach ($grouped as $file => $violations) {
            $allowed = $baseline->allowed($file, 'base-selector-override');

            if (count($violations) <= $allowed) {
                continue;
            }

            $messages[] = "{$file} permite {$allowed} overrides heredados, encontrados ".count($violations);

            foreach ($violations as $violation) {
                $messages[] = "  `{$violation['selector']}` redefine .{$violation['class']} de la capa {$violation['owner']}";
            }
        }

        $this->assertSame([], $messages, 'Un módulo redefine selectores base:'.PHP_EOL.implode(PHP_EOL, $messages));
    }

    public function test_the_module_override_inventory_is_versioned(): void
    {
        $this->assertFileExists(base_path(config('ui-conformance.layer_baseline')));
    }
}
