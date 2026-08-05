<?php

namespace App\Support\Ui;

class CssLayerAnalyzer
{
    /** Orden de dependencia: cada capa solo puede depender de las anteriores. */
    public const LAYERS = ['tokens', 'primitives', 'patterns', 'archetypes', 'modules'];

    public function __construct(private readonly string $root = 'resources/css/m3') {}

    /**
     * @return array<string, list<string>> Archivos por capa.
     */
    public function files(): array
    {
        $files = [];

        foreach (self::LAYERS as $layer) {
            $directory = base_path("{$this->root}/{$layer}");
            $found = is_dir($directory) ? glob("{$directory}/*.css") : [];
            sort($found);
            $files[$layer] = $found;
        }

        return $files;
    }

    /**
     * Clase del sistema -> capa que la define como selector principal.
     *
     * @return array<string, string>
     */
    public function ownership(): array
    {
        $owners = [];

        foreach ($this->files() as $layer => $files) {
            foreach ($files as $file) {
                foreach ($this->selectors((string) file_get_contents($file)) as $selector) {
                    foreach ($this->keyClasses($selector) as $class) {
                        $owners[$class] ??= $layer;
                    }
                }
            }
        }

        return $owners;
    }

    /**
     * Infracciones del contrato de capas.
     *
     * @return list<array{file: string, layer: string, selector: string, class: string, owner: string, kind: string}>
     */
    public function violations(): array
    {
        $owners = $this->ownership();
        $violations = [];

        foreach ($this->files() as $layer => $files) {
            $index = array_search($layer, self::LAYERS, true);

            foreach ($files as $file) {
                $relative = str_replace('\\', '/', substr($file, strlen(base_path()) + 1));

                foreach ($this->selectors((string) file_get_contents($file)) as $selector) {
                    foreach ($this->systemClasses($selector) as $class) {
                        $owner = $owners[$class] ?? $layer;
                        $ownerIndex = array_search($owner, self::LAYERS, true);

                        if ($ownerIndex > $index) {
                            $violations[] = [
                                'file' => $relative, 'layer' => $layer, 'selector' => $selector,
                                'class' => $class, 'owner' => $owner, 'kind' => 'forward-dependency',
                            ];

                            continue;
                        }

                        if ($layer === 'modules' && $ownerIndex < $index) {
                            $violations[] = [
                                'file' => $relative, 'layer' => $layer, 'selector' => $selector,
                                'class' => $class, 'owner' => $owner, 'kind' => 'base-selector-override',
                            ];
                        }
                    }
                }
            }
        }

        return $violations;
    }

    /**
     * @return list<string>
     */
    public function selectors(string $css): array
    {
        $css = preg_replace('/\/\*.*?\*\//s', '', $css) ?? $css;
        preg_match_all('/(?:^|[};])\s*([^{};@]+)\{/m', $css, $matches);

        $selectors = [];

        foreach ($matches[1] as $group) {
            foreach (explode(',', $group) as $selector) {
                $selector = trim(preg_replace('/\s+/', ' ', $selector) ?? $selector);

                if ($selector !== '' && ! str_starts_with($selector, '@')) {
                    $selectors[] = $selector;
                }
            }
        }

        return $selectors;
    }

    /**
     * Clases del sistema presentes en cualquier posición del selector.
     *
     * @return list<string>
     */
    public function systemClasses(string $selector): array
    {
        preg_match_all('/\.(md-[\w-]+)/', $selector, $matches);

        return array_values(array_unique($matches[1]));
    }

    /**
     * Clases del sistema del selector clave (el compuesto más a la derecha).
     *
     * @return list<string>
     */
    public function keyClasses(string $selector): array
    {
        $parts = preg_split('/\s*[ >+~]\s*/', $selector) ?: [$selector];

        return $this->systemClasses((string) end($parts));
    }
}
