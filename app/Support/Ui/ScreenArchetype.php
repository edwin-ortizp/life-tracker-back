<?php

namespace App\Support\Ui;

class ScreenArchetype
{
    public const LIST = 'list';

    public const DETAIL = 'detail';

    public const DASHBOARD = 'dashboard';

    public const DAILY_LOG = 'daily-log';

    public const SETTINGS = 'settings';

    public const GUIDED_FLOW = 'guided-flow';

    /** Arquetipos aprobados. Uno nuevo se documenta y aprueba antes de usarse. */
    public const ALL = [
        self::LIST,
        self::DETAIL,
        self::DASHBOARD,
        self::DAILY_LOG,
        self::SETTINGS,
        self::GUIDED_FLOW,
    ];

    public const FALLBACK = self::LIST;

    /**
     * Arquetipo de la pantalla actual.
     *
     * Precedencia: el declarado por la vista, el declarado por la pestaña
     * activa, el declarado por el módulo y, en último lugar, el de reserva.
     */
    public static function resolve(?string $declared, array $definition = [], string $routeName = ''): string
    {
        $archetype = $declared
            ?? self::fromTabs($definition['tabs'] ?? [], $routeName)
            ?? $definition['archetype']
            ?? self::FALLBACK;

        abort_unless(in_array($archetype, self::ALL, true), 500, "Arquetipo de pantalla no aprobado: {$archetype}");

        return $archetype;
    }

    /**
     * Indica si la pantalla declara su arquetipo en lugar de heredar el de reserva.
     */
    public static function isDeclared(?string $declared, array $definition = [], string $routeName = ''): bool
    {
        return $declared !== null
            || self::fromTabs($definition['tabs'] ?? [], $routeName) !== null
            || isset($definition['archetype']);
    }

    private static function fromTabs(array $tabs, string $routeName): ?string
    {
        foreach ($tabs as $tab) {
            if (($tab['route'] ?? null) === $routeName && isset($tab['archetype'])) {
                return $tab['archetype'];
            }
        }

        return null;
    }
}
