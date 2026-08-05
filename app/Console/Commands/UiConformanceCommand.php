<?php

namespace App\Console\Commands;

use App\Support\Ui\ConformanceBaseline;
use App\Support\Ui\UiConformanceScanner;
use Illuminate\Console\Command;

class UiConformanceCommand extends Command
{
    protected $signature = 'ui:conformance
        {--update-baseline : Regenera el inventario de deuda visual}
        {--rule= : Analiza solo las infracciones de una regla}
        {--list : Enumera cada infracción con archivo y línea}';

    protected $description = 'Analiza las vistas Blade contra el contrato del sistema de diseño';

    public function handle(): int
    {
        $scanner = UiConformanceScanner::fromConfig();
        $violations = $scanner->scan();

        if ($rule = $this->option('rule')) {
            $violations = array_values(array_filter($violations, fn ($violation) => $violation->rule === $rule));
        }

        if ($this->option('update-baseline')) {
            ConformanceBaseline::write($scanner->tally($violations));
            $this->info('Inventario actualizado: '.count($violations).' desviaciones registradas.');

            return self::SUCCESS;
        }

        if ($this->option('list')) {
            foreach ($violations as $violation) {
                $this->line($violation->describe());
            }
        }

        $baseline = ConformanceBaseline::load();
        $exceeded = $baseline->exceeded($violations);

        $this->line('Deuda visual inventariada: '.$baseline->total());
        $this->line('Desviaciones encontradas: '.count($violations));

        if ($exceeded === []) {
            $this->info('Sin deuda visual nueva.');

            return self::SUCCESS;
        }

        foreach ($exceeded as $entry) {
            $this->error("{$entry['file']} [{$entry['rule']}] permite {$entry['allowed']}, encontradas {$entry['found']}");

            foreach ($entry['locations'] as $location) {
                $this->line('  '.$location);
            }
        }

        return self::FAILURE;
    }
}
