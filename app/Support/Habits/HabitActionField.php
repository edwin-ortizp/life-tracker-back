<?php

namespace App\Support\Habits;

/**
 * Un campo del formulario de una acción de hábito.
 *
 * El mismo campo sirve a los dos modos: en «auto» todos se configuran una vez en
 * ajustes; en «prompt» los marcados con $ask se preguntan al completar el hábito
 * y el resto conserva el valor fijo de la configuración.
 */
class HabitActionField
{
    /**
     * @param  'number'|'text'|'select'  $type
     * @param  array<string|int, string>  $options  Solo para type = select.
     * @param  array<int, mixed>  $rules  Reglas de validación de Laravel.
     */
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly string $type = 'text',
        public readonly array $options = [],
        public readonly array $rules = [],
        public readonly mixed $default = null,
        public readonly ?string $help = null,
        public readonly bool $ask = false,
    ) {}

    public static function number(string $key, string $label, array $rules = [], mixed $default = null, ?string $help = null, bool $ask = false): self
    {
        return new self($key, $label, 'number', [], $rules, $default, $help, $ask);
    }

    public static function text(string $key, string $label, array $rules = [], mixed $default = null, ?string $help = null, bool $ask = false): self
    {
        return new self($key, $label, 'text', [], $rules, $default, $help, $ask);
    }

    /** @param array<string|int, string> $options */
    public static function select(string $key, string $label, array $options, array $rules = [], mixed $default = null, ?string $help = null, bool $ask = false): self
    {
        return new self($key, $label, 'select', $options, $rules, $default, $help, $ask);
    }

    /** Descripción textual del campo, para que un agente MCP sepa qué enviar. */
    public function describe(): string
    {
        $description = "{$this->key} ({$this->label})";

        if ($this->type === 'select' && $this->options !== []) {
            $values = collect($this->options)
                ->map(fn (string $label, $value) => "{$value} = {$label}")
                ->implode('; ');

            return "{$description}: {$values}";
        }

        return $description;
    }

    /** @return array<string, mixed> Forma serializable para la vista y para MCP. */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'type' => $this->type,
            'options' => $this->options,
            'default' => $this->default,
            'help' => $this->help,
            'ask' => $this->ask,
        ];
    }
}
