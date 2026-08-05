<?php

namespace App\Support;

use App\Models\MoodReflection;

/**
 * The reflection wizard is a fixed, hand-written sequence: every question, hint and
 * successor is declared here. Nothing is generated, classified or inferred from what
 * the user writes — the tool only asks and stores.
 */
final class ReflectionSteps
{
    public const SITUATION = 'situation';

    public const AUTOMATIC_THOUGHT = 'automatic_thought';

    public const EVIDENCE_FOR = 'evidence_for';

    public const EVIDENCE_AGAINST = 'evidence_against';

    public const BALANCED_PERSPECTIVE = 'balanced_perspective';

    public const INTENSITY_AFTER = 'intensity_after';

    public const NEXT_STEP = 'next_step';

    /**
     * @return array<string, array{field: string, on: string, type: string, question: string, hint: string, label: string}>
     */
    public static function definition(): array
    {
        return [
            self::SITUATION => [
                'field' => 'situation',
                'on' => 'entry',
                'type' => 'text',
                'label' => 'Situación',
                'question' => '¿Qué estaba pasando?',
                'hint' => 'Describe los hechos como los recuerdas: dónde estabas, con quién y qué ocurrió.',
            ],
            self::AUTOMATIC_THOUGHT => [
                'field' => 'automatic_thought',
                'on' => 'reflection',
                'type' => 'text',
                'label' => 'Pensamiento',
                'question' => '¿Qué pensaste en ese momento?',
                'hint' => 'La frase que se te pasó por la cabeza, tal como apareció.',
            ],
            self::EVIDENCE_FOR => [
                'field' => 'evidence_for',
                'on' => 'reflection',
                'type' => 'text',
                'label' => 'Lo que lo apoya',
                'question' => '¿Qué hechos apoyan ese pensamiento?',
                'hint' => 'Solo hechos observables, no interpretaciones.',
            ],
            self::EVIDENCE_AGAINST => [
                'field' => 'evidence_against',
                'on' => 'reflection',
                'type' => 'text',
                'label' => 'Lo que no encaja',
                'question' => '¿Qué hechos no encajan con ese pensamiento?',
                'hint' => 'Detalles que quedarían fuera si el pensamiento fuera del todo cierto.',
            ],
            self::BALANCED_PERSPECTIVE => [
                'field' => 'balanced_perspective',
                'on' => 'reflection',
                'type' => 'text',
                'label' => 'Otra manera de verlo',
                'question' => 'Con todo lo anterior, ¿cómo lo describirías ahora?',
                'hint' => 'Con tus palabras, sin obligarte a que suene positivo.',
            ],
            self::INTENSITY_AFTER => [
                'field' => 'intensity_after',
                'on' => 'reflection',
                'type' => 'scale',
                'label' => 'Intensidad ahora',
                'question' => '¿Con qué intensidad sientes la emoción en este momento?',
                'hint' => 'Del 1 al 5. Puede ser igual, menor o mayor que al principio.',
            ],
            self::NEXT_STEP => [
                'field' => 'next_step',
                'on' => 'reflection',
                'type' => 'text',
                'label' => 'Próximo paso',
                'question' => '¿Hay algo que quieras hacer con esto?',
                'hint' => 'Opcional. Puede ser una acción pequeña o nada en absoluto.',
            ],
        ];
    }

    /** @return list<string> */
    public static function order(): array
    {
        return array_keys(self::definition());
    }

    public static function first(): string
    {
        return self::order()[0];
    }

    public static function last(): string
    {
        $order = self::order();

        return $order[count($order) - 1];
    }

    public static function exists(?string $step): bool
    {
        return $step !== null && array_key_exists($step, self::definition());
    }

    public static function get(string $step): array
    {
        return self::definition()[$step] ?? self::definition()[self::first()];
    }

    public static function position(string $step): int
    {
        $index = array_search($step, self::order(), true);

        return $index === false ? 1 : $index + 1;
    }

    public static function total(): int
    {
        return count(self::order());
    }

    public static function isLast(string $step): bool
    {
        return $step === self::last();
    }

    /** The step that follows, or null when the sequence is finished. */
    public static function next(string $step): ?string
    {
        $order = self::order();
        $index = array_search($step, $order, true);

        if ($index === false || $index + 1 >= count($order)) {
            return null;
        }

        return $order[$index + 1];
    }

    public static function previous(string $step): ?string
    {
        $order = self::order();
        $index = array_search($step, $order, true);

        if ($index === false || $index === 0) {
            return null;
        }

        return $order[$index - 1];
    }

    /**
     * Steps with a stored answer, in sequence order. Skipped steps are simply absent:
     * the summary never fills them in.
     *
     * @return list<array{step: string, label: string, question: string, answer: string}>
     */
    public static function answered(MoodReflection $reflection): array
    {
        $entry = $reflection->moodEntry;
        $answered = [];

        foreach (self::definition() as $step => $definition) {
            $value = $definition['on'] === 'entry'
                ? $entry?->{$definition['field']}
                : $reflection->{$definition['field']};

            if ($value === null || $value === '') {
                continue;
            }

            $answered[] = [
                'step' => $step,
                'label' => $definition['label'],
                'question' => $definition['question'],
                'answer' => $definition['type'] === 'scale' ? $value.' de 5' : (string) $value,
            ];
        }

        return $answered;
    }
}
