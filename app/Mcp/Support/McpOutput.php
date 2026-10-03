<?php

namespace App\Mcp\Support;

/**
 * Ayudas para que las respuestas del MCP gasten poco contexto del agente.
 */
final class McpOutput
{
    /**
     * Quita las claves con valor null, también en arreglos anidados. Las listas
     * vacías se conservan: "aliases: []" dice algo distinto a no saberlo.
     *
     * @param  array<mixed>  $data
     * @return array<mixed>
     */
    public static function compact(array $data): array
    {
        $isList = array_is_list($data);
        $result = [];

        foreach ($data as $key => $value) {
            if ($value === null) {
                continue;
            }

            $result[$key] = is_array($value) ? self::compact($value) : $value;
        }

        return $isList ? array_values($result) : $result;
    }

    /** Recorta un texto largo para los modos resumidos, sin cortar palabras. */
    public static function excerpt(?string $text, int $limit = 280): ?string
    {
        if ($text === null || trim($text) === '') {
            return null;
        }

        $text = trim(preg_replace('/\s+/u', ' ', $text));

        if (mb_strlen($text) <= $limit) {
            return $text;
        }

        $cut = mb_substr($text, 0, $limit);
        $space = mb_strrpos($cut, ' ');

        return rtrim($space !== false && $space > $limit * 0.6 ? mb_substr($cut, 0, $space) : $cut, ' ,.;:').'…';
    }
}
