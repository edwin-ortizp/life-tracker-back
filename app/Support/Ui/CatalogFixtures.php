<?php

namespace App\Support\Ui;

/**
 * Datos deterministas del catálogo.
 *
 * No contienen información personal ni dependen del estado de la base de
 * datos: las capturas visuales deben ser idénticas en cualquier entorno.
 */
class CatalogFixtures
{
    public const LONG_TEXT = 'Revisar el plan de mantenimiento preventivo del vehículo compartido antes del cierre del trimestre';

    /**
     * @return array<string, string>
     */
    public static function statusOptions(): array
    {
        return [
            'todo' => 'Pendiente',
            'doing' => 'En curso',
            'done' => 'Completada',
            'archived' => 'Archivada',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function periodOptions(): array
    {
        return [
            'day' => 'Hoy',
            'week' => 'Esta semana',
            'month' => 'Este mes',
        ];
    }

    /**
     * @return list<array{headline: string, supporting: string, tone: string}>
     */
    public static function listItems(): array
    {
        return [
            ['headline' => 'Preparar la compra semanal', 'supporting' => 'Comidas · vence hoy', 'tone' => 'primary'],
            ['headline' => self::LONG_TEXT, 'supporting' => 'Vehículos · sin fecha', 'tone' => 'warning'],
            ['headline' => 'Registrar el peso', 'supporting' => 'Salud · completada', 'tone' => 'success'],
        ];
    }

    /**
     * @return list<array{label: string, value: ?string, unit: ?string, support: ?string, tone: string}>
     */
    public static function metrics(): array
    {
        return [
            ['label' => 'Hidratación', 'value' => '2350', 'unit' => 'ml', 'support' => 'Sobre la meta diaria', 'tone' => 'success'],
            ['label' => 'Tareas completadas', 'value' => '12', 'unit' => null, 'support' => 'De 18 planificadas', 'tone' => 'primary'],
            ['label' => 'Promedio de sueño de los últimos treinta días', 'value' => '6.4', 'unit' => 'h', 'support' => 'Por debajo del objetivo', 'tone' => 'warning'],
            ['label' => 'Racha de hábitos', 'value' => null, 'unit' => 'días', 'support' => 'Sin registros todavía', 'tone' => 'neutral'],
        ];
    }

    /**
     * @return list<string>
     */
    public static function flowSteps(): array
    {
        return ['Contexto', 'Emoción', 'Personas', 'Cierre'];
    }
}
