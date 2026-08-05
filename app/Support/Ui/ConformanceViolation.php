<?php

namespace App\Support\Ui;

class ConformanceViolation
{
    public function __construct(
        public readonly string $file,
        public readonly int $line,
        public readonly string $rule,
        public readonly string $region,
        public readonly string $message,
        public readonly string $snippet,
    ) {}

    public function location(): string
    {
        return "{$this->file}:{$this->line}";
    }

    public function describe(): string
    {
        return "[{$this->rule}] {$this->location()} ({$this->region}) {$this->message} -> {$this->snippet}";
    }

    public function toArray(): array
    {
        return [
            'file' => $this->file,
            'line' => $this->line,
            'rule' => $this->rule,
            'region' => $this->region,
            'message' => $this->message,
            'snippet' => $this->snippet,
        ];
    }
}
