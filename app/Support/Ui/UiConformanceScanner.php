<?php

namespace App\Support\Ui;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

class UiConformanceScanner
{
    public function __construct(private readonly array $config) {}

    public static function fromConfig(?array $config = null): self
    {
        return new self($config ?? config('ui-conformance'));
    }

    /**
     * @return list<ConformanceViolation>
     */
    public function scan(): array
    {
        $violations = [];

        foreach ($this->views() as $file) {
            foreach ($this->scanFile($file) as $violation) {
                $violations[] = $violation;
            }
        }

        usort($violations, fn (ConformanceViolation $a, ConformanceViolation $b) => [$a->file, $a->line, $a->rule] <=> [$b->file, $b->line, $b->rule]);

        return $violations;
    }

    /**
     * @return list<ConformanceViolation>
     */
    public function scanRule(string $rule): array
    {
        return array_values(array_filter($this->scan(), fn (ConformanceViolation $violation) => $violation->rule === $rule));
    }

    /**
     * Conteo de infracciones por archivo y regla, el formato del baseline.
     *
     * @param  list<ConformanceViolation>|null  $violations
     * @return array<string, array<string, int>>
     */
    public function tally(?array $violations = null): array
    {
        $tally = [];

        foreach ($violations ?? $this->scan() as $violation) {
            $tally[$violation->file][$violation->rule] = ($tally[$violation->file][$violation->rule] ?? 0) + 1;
        }

        ksort($tally);

        foreach ($tally as $file => $rules) {
            ksort($rules);
            $tally[$file] = $rules;
        }

        return $tally;
    }

    /**
     * @return list<string> Rutas absolutas de las vistas analizadas.
     */
    public function views(): array
    {
        $root = base_path($this->config['paths']['views']);

        if (! is_dir($root)) {
            return [];
        }

        $files = [];
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS));

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if (! $file->isFile() || ! str_ends_with($file->getFilename(), '.blade.php')) {
                continue;
            }

            $path = $this->relative($file->getPathname());

            if ($this->excluded($path)) {
                continue;
            }

            $files[] = $file->getPathname();
        }

        sort($files);

        return $files;
    }

    /**
     * @return list<ConformanceViolation>
     */
    private function scanFile(string $path): array
    {
        $relative = $this->relative($path);
        $contents = (string) file_get_contents($path);
        $violations = [];
        $seen = [];

        foreach ($this->config['rules'] as $rule => $definition) {
            if ($this->exempt($relative, $rule)) {
                continue;
            }

            $matches = match ($definition['detector'] ?? 'patterns') {
                'inline-style' => $this->inlineStyleMatches($contents, $definition),
                default => $this->patternMatches($contents, $definition),
            };

            foreach ($matches as [$offset, $snippet, $message]) {
                $line = substr_count($contents, "\n", 0, $offset) + 1;
                $key = "{$rule}|{$line}|{$snippet}";

                if (isset($seen[$key])) {
                    continue;
                }

                $seen[$key] = true;

                $violations[] = new ConformanceViolation(
                    file: $relative,
                    line: $line,
                    rule: $rule,
                    region: $this->region($relative),
                    message: $message,
                    snippet: $snippet,
                );
            }
        }

        return $violations;
    }

    /**
     * @return list<array{0: int, 1: string, 2: string}>
     */
    private function patternMatches(string $contents, array $definition): array
    {
        $matches = [];

        foreach ($definition['patterns'] as $pattern => $message) {
            if (preg_match_all($pattern, $contents, $found, PREG_OFFSET_CAPTURE) === false) {
                continue;
            }

            foreach ($found[0] as [$text, $offset]) {
                $matches[] = [$offset, $this->snippet($contents, $offset, $text), $message];
            }
        }

        return $matches;
    }

    /**
     * @return list<array{0: int, 1: string, 2: string}>
     */
    private function inlineStyleMatches(string $contents, array $definition): array
    {
        $matches = [];
        $message = $definition['message'] ?? 'Declaración `style` no permitida.';

        preg_match_all('/(?:x-bind:|:|\s)style\s*=\s*(["\'])(.*?)\1/s', $contents, $found, PREG_OFFSET_CAPTURE);

        foreach ($found[0] as $index => [$text, $offset]) {
            if ($this->onlyDynamicCustomProperties($found[2][$index][0])) {
                continue;
            }

            $matches[] = [$offset, $this->snippet($contents, $offset, trim($text)), $message];
        }

        return $matches;
    }

    private function onlyDynamicCustomProperties(string $declarations): bool
    {
        $allowed = $this->config['dynamic_custom_properties'] ?? [];
        $body = trim(preg_replace('/\{\{.*?\}\}/s', 'x', $declarations) ?? '');

        if ($body === '') {
            return true;
        }

        foreach (explode(';', $body) as $declaration) {
            $declaration = trim($declaration);

            if ($declaration === '') {
                continue;
            }

            $property = trim(explode(':', $declaration, 2)[0]);

            if (! in_array($property, $allowed, true)) {
                return false;
            }
        }

        return true;
    }

    private function snippet(string $contents, int $offset, string $text): string
    {
        $text = trim(preg_replace('/\s+/', ' ', $text) ?? $text);

        if (mb_strlen($text) > 80) {
            $text = mb_substr($text, 0, 77).'...';
        }

        return $text;
    }

    private function region(string $relative): string
    {
        $inside = str_replace('\\', '/', substr($relative, strlen($this->config['paths']['views']) + 1));
        $directory = trim(dirname($inside), '.');

        return $directory === '' ? 'root' : $directory;
    }

    private function excluded(string $relative): bool
    {
        $inside = substr($relative, strlen($this->config['paths']['views']) + 1);

        foreach ($this->config['exclude'] ?? [] as $pattern) {
            if (fnmatch($pattern, $inside)) {
                return true;
            }
        }

        return false;
    }

    private function exempt(string $relative, string $rule): bool
    {
        foreach ($this->config['exceptions'] ?? [] as $exception) {
            if (fnmatch($exception['path'], $relative) && in_array($rule, $exception['rules'], true)) {
                return true;
            }
        }

        return false;
    }

    private function relative(string $path): string
    {
        $relative = str_replace('\\', '/', substr($path, strlen(base_path()) + 1));

        return $relative;
    }
}
