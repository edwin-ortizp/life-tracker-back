<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Resolucion del cliente movil.
 *
 * La deteccion tiene que ser identica en el `mount` de un componente Livewire y
 * en cada `update` posterior, asi que se resuelve en servidor a partir de datos
 * que no cambian dentro de una sesion: la cookie de preferencia y, si no hay,
 * el User-Agent. Decidirlo en cliente (como hacia `matchMedia` en el layout)
 * obliga a enviar los dos marcos en el HTML y provoca el parpadeo inicial.
 */
class Device
{
    /** Cookie con la que el usuario fuerza uno u otro marco. */
    public const COOKIE = 'lt-view';

    public const MOBILE = 'mobile';

    public const DESKTOP = 'desktop';

    /**
     * Fragmentos de User-Agent de telefonos. Deliberadamente no incluye
     * tabletas: el marco de escritorio ya se aprovecha de esa anchura.
     */
    private const MOBILE_AGENTS = [
        'iphone', 'ipod', 'android.*mobile', 'windows phone', 'blackberry',
        'bb10', 'opera mini', 'iemobile', 'mobile.*firefox', 'webos',
    ];

    public static function detect(Request $request): bool
    {
        $preference = $request->cookie(self::COOKIE);

        if ($preference === self::MOBILE) {
            return true;
        }

        if ($preference === self::DESKTOP) {
            return false;
        }

        return self::looksLikeAPhone((string) $request->userAgent());
    }

    public static function looksLikeAPhone(string $userAgent): bool
    {
        if ($userAgent === '') {
            return false;
        }

        $agent = mb_strtolower($userAgent);

        // Un iPad moderno se anuncia como Macintosh: se queda en escritorio,
        // que es lo que queremos.
        foreach (self::MOBILE_AGENTS as $needle) {
            if (preg_match('/'.$needle.'/', $agent) === 1) {
                return true;
            }
        }

        return false;
    }

    /** True cuando la peticion en curso se sirve con el marco movil. */
    public static function isMobile(): bool
    {
        return app()->bound('device.mobile') && app('device.mobile') === true;
    }
}
