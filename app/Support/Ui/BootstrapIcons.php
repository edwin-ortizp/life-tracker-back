<?php

namespace App\Support\Ui;

class BootstrapIcons
{
    public static function options(): array
    {
        static $options;
        if ($options !== null) {
            return $options;
        }
        $path = resource_path('data/bootstrap-icons.json');
        $catalog = is_file($path) ? json_decode(file_get_contents($path), true) : [];
        $options = [];
        foreach ($catalog as $name) {
            $options['bi-'.$name] = str_replace('-', ' ', $name);
        }

        return $options;
    }
}
