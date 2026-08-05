<?php

namespace Tests\Feature\Ui;

use App\Support\Ui\ConformanceBaseline;
use App\Support\Ui\ConformanceViolation;
use App\Support\Ui\UiConformanceScanner;
use Tests\TestCase;

class UiConformanceTest extends TestCase
{
    /** @var list<ConformanceViolation>|null */
    private static ?array $violations = null;

    /**
     * @return list<ConformanceViolation>
     */
    private function violations(): array
    {
        return self::$violations ??= UiConformanceScanner::fromConfig()->scan();
    }

    /**
     * @param  list<ConformanceViolation>  $violations
     */
    private function report(array $violations, int $limit = 15): string
    {
        $lines = array_map(fn (ConformanceViolation $violation) => '  '.$violation->describe(), array_slice($violations, 0, $limit));

        if (count($violations) > $limit) {
            $lines[] = '  ... y '.(count($violations) - $limit).' más.';
        }

        return PHP_EOL.implode(PHP_EOL, $lines);
    }

    public function test_the_visual_debt_inventory_is_versioned(): void
    {
        $path = base_path(config('ui-conformance.baseline'));

        $this->assertFileExists($path, 'El inventario de deuda visual debe estar versionado.');

        $baseline = ConformanceBaseline::load();

        $this->assertGreaterThan(0, $baseline->total(), 'El inventario inicial no puede estar vacío.');
    }

    public function test_a_contribution_does_not_increase_the_visual_debt(): void
    {
        $exceeded = ConformanceBaseline::load()->exceeded($this->violations());

        $messages = [];

        foreach ($exceeded as $entry) {
            $messages[] = "{$entry['file']} [{$entry['rule']}] permite {$entry['allowed']}, encontradas {$entry['found']}";

            foreach ($entry['locations'] as $location) {
                $messages[] = '  '.$location;
            }
        }

        $this->assertSame([], $exceeded, 'Se agregó deuda visual nueva:'.PHP_EOL.implode(PHP_EOL, $messages));
    }

    public function test_retired_patterns_are_reported_with_file_and_line(): void
    {
        $this->assertRuleIsInventoried('retired-pattern');
    }

    public function test_direct_visual_values_are_reported_with_file_and_line(): void
    {
        $this->assertRuleIsInventoried('direct-color');
        $this->assertRuleIsInventoried('inline-style');
    }

    public function test_local_substitutions_of_canonical_components_are_reported_with_file_and_line(): void
    {
        $this->assertRuleIsInventoried('local-component-substitution');
    }

    public function test_dynamic_custom_properties_are_the_only_allowed_inline_declarations(): void
    {
        $config = config('ui-conformance');
        $config['paths']['views'] = 'tests/Fixtures/ui-conformance';

        $violations = (new UiConformanceScanner($config))->scanRule('inline-style');

        $reported = array_map(fn (ConformanceViolation $violation) => $violation->snippet, $violations);

        $this->assertCount(1, $violations, 'Solo la declaración arbitraria debe reportarse.'.$this->report($violations));
        $this->assertStringContainsString('padding', $reported[0]);
    }

    public function test_documented_exceptions_declare_reason_and_scope(): void
    {
        foreach (config('ui-conformance.exceptions') as $exception) {
            $this->assertArrayHasKey('path', $exception);
            $this->assertNotEmpty($exception['rules'] ?? []);
            $this->assertNotEmpty($exception['reason'] ?? '', "La excepción de {$exception['path']} debe declarar un motivo.");
            $this->assertNotEmpty($exception['scope'] ?? '', "La excepción de {$exception['path']} debe declarar un alcance.");
        }
    }

    private function assertRuleIsInventoried(string $rule): void
    {
        $violations = array_values(array_filter($this->violations(), fn (ConformanceViolation $violation) => $violation->rule === $rule));
        $baseline = ConformanceBaseline::load();

        foreach ($violations as $violation) {
            $this->assertMatchesRegularExpression('/^resources\/views\/.+\.blade\.php:\d+$/', $violation->location(), "La regla {$rule} debe reportar archivo y línea.");
            $this->assertNotSame('', $violation->message, "La regla {$rule} debe explicar el incumplimiento.");
            $this->assertGreaterThan(0, $baseline->allowed($violation->file, $rule), "La infracción {$violation->describe()} no está inventariada.");
        }
    }
}
