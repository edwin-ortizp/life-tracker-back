<?php

namespace App\Support\Ui;

use Illuminate\Support\Str;

class FieldIdentity
{
    /**
     * Identificador estable y determinista para un campo del sistema.
     *
     * Se deriva del nombre Livewire cuando existe y de la etiqueta en caso
     * contrario, de modo que las capturas visuales no cambien entre corridas.
     */
    public static function for(?string $name, string $label): string
    {
        $source = $name ?: $label;
        $slug = Str::slug(str_replace(['.', '[', ']', '_'], '-', $source));

        return 'field-'.($slug !== '' ? $slug : substr(md5($source), 0, 8));
    }
}
