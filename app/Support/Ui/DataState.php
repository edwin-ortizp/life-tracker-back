<?php

namespace App\Support\Ui;

class DataState
{
    public const INITIAL = 'initial';

    public const LOADING = 'loading';

    public const CONTENT = 'content';

    public const EMPTY = 'empty';

    public const FILTERED_EMPTY = 'filtered-empty';

    public const ERROR = 'error';

    public const ALL = [
        self::INITIAL,
        self::LOADING,
        self::CONTENT,
        self::EMPTY,
        self::FILTERED_EMPTY,
        self::ERROR,
    ];

    /**
     * Clasifica el estado de una región de datos.
     *
     * Distingue una colección realmente vacía de una colección oculta por los
     * filtros activos, para que cada caso ofrezca la acción que corresponde.
     *
     * @param  int  $visible  Registros visibles con los filtros aplicados.
     * @param  int|null  $total  Registros existentes sin filtrar.
     */
    public static function resolve(
        int $visible,
        ?int $total = null,
        bool $loading = false,
        bool $requested = true,
        ?string $error = null,
    ): string {
        if ($error !== null) {
            return self::ERROR;
        }

        if ($loading) {
            return self::LOADING;
        }

        if (! $requested) {
            return self::INITIAL;
        }

        if ($visible > 0) {
            return self::CONTENT;
        }

        return ($total ?? 0) > 0 ? self::FILTERED_EMPTY : self::EMPTY;
    }
}
