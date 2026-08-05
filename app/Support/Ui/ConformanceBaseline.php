<?php

namespace App\Support\Ui;

class ConformanceBaseline
{
    /**
     * @param  array<string, array<string, int>>  $files
     */
    public function __construct(public readonly array $files = []) {}

    public static function load(?string $path = null): self
    {
        $path ??= base_path(config('ui-conformance.baseline'));

        if (! is_file($path)) {
            return new self;
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return new self($decoded['files'] ?? []);
    }

    /**
     * @param  array<string, array<string, int>>  $tally
     */
    public static function write(array $tally, ?string $path = null): void
    {
        $path ??= base_path(config('ui-conformance.baseline'));

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        $totals = [];

        foreach ($tally as $rules) {
            foreach ($rules as $rule => $count) {
                $totals[$rule] = ($totals[$rule] ?? 0) + $count;
            }
        }

        ksort($totals);

        file_put_contents($path, json_encode([
            'description' => 'Inventario de deuda visual. Una contribución puede conservarla, no aumentarla.',
            'totals' => $totals,
            'files' => $tally,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");
    }

    public function allowed(string $file, string $rule): int
    {
        return $this->files[$file][$rule] ?? 0;
    }

    public function total(): int
    {
        return array_sum(array_map('array_sum', $this->files));
    }

    /**
     * Infracciones que exceden el inventario, agrupadas por archivo y regla.
     *
     * @param  list<ConformanceViolation>  $violations
     * @return list<array{file: string, rule: string, allowed: int, found: int, locations: list<string>}>
     */
    public function exceeded(array $violations): array
    {
        $grouped = [];

        foreach ($violations as $violation) {
            $grouped[$violation->file][$violation->rule][] = $violation;
        }

        $exceeded = [];

        foreach ($grouped as $file => $rules) {
            foreach ($rules as $rule => $found) {
                $allowed = $this->allowed($file, $rule);

                if (count($found) <= $allowed) {
                    continue;
                }

                $exceeded[] = [
                    'file' => $file,
                    'rule' => $rule,
                    'allowed' => $allowed,
                    'found' => count($found),
                    'locations' => array_map(fn (ConformanceViolation $violation) => $violation->describe(), $found),
                ];
            }
        }

        return $exceeded;
    }
}
