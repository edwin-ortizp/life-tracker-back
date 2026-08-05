<?php

namespace App\Support;

use App\Models\User;

/**
 * The shared emotional vocabulary. Every definition carries a stable `key`, so a default
 * emotion stays recognizable after the user renames it or changes its emoji.
 */
class DefaultMoodStates
{
    /** Give an account every default it is still missing. */
    public static function createFor(User $user): void
    {
        app(MoodCatalogRestorer::class)->syncDefaults($user);
    }

    /** @return list<array{key: string, emoji: string, text: string, value: int, category: string}> */
    public static function all(): array
    {
        return [...self::base(), ...self::nuanced()];
    }

    /** The original catalog every account started with. */
    public static function base(): array
    {
        return [
            ['key' => 'enamorado', 'emoji' => '😍', 'text' => 'Enamorado', 'value' => 10, 'category' => 'Emocional'],
            ['key' => 'feliz', 'emoji' => '😊', 'text' => 'Feliz', 'value' => 10, 'category' => 'Emocional'],
            ['key' => 'energetico', 'emoji' => '🌟', 'text' => 'Energético', 'value' => 10, 'category' => 'Físico'],
            ['key' => 'productivo', 'emoji' => '🧠', 'text' => 'Productivo', 'value' => 10, 'category' => 'Mental'],
            ['key' => 'confiado', 'emoji' => '😎', 'text' => 'Confiado', 'value' => 9, 'category' => 'Mental'],
            ['key' => 'tranquilo', 'emoji' => '😌', 'text' => 'Tranquilo', 'value' => 8, 'category' => 'Emocional'],
            ['key' => 'pensativo', 'emoji' => '🤔', 'text' => 'Pensativo', 'value' => 6, 'category' => 'Mental'],
            ['key' => 'aburrido', 'emoji' => '🥱', 'text' => 'Aburrido', 'value' => 5, 'category' => 'Emocional'],
            ['key' => 'pereza', 'emoji' => '😴', 'text' => 'Pereza', 'value' => 4, 'category' => 'Físico'],
            ['key' => 'confundido', 'emoji' => '😕', 'text' => 'Confundido', 'value' => 5, 'category' => 'Mental'],
            ['key' => 'nervioso', 'emoji' => '😬', 'text' => 'Nervioso', 'value' => 3, 'category' => 'Emocional'],
            ['key' => 'abrumado', 'emoji' => '🤯', 'text' => 'Abrumado', 'value' => 3, 'category' => 'Mental'],
            ['key' => 'frustracion', 'emoji' => '😤', 'text' => 'Frustración', 'value' => 3, 'category' => 'Emocional'],
            ['key' => 'ansioso', 'emoji' => '😰', 'text' => 'Ansioso', 'value' => 2, 'category' => 'Emocional'],
            ['key' => 'cansado', 'emoji' => '😪', 'text' => 'Cansado', 'value' => 2, 'category' => 'Físico'],
            ['key' => 'triste', 'emoji' => '😢', 'text' => 'Triste', 'value' => 1, 'category' => 'Emocional'],
            ['key' => 'enojado', 'emoji' => '😡', 'text' => 'Enojado', 'value' => 1, 'category' => 'Emocional'],
            ['key' => 'enfermo', 'emoji' => '🤒', 'text' => 'Enfermo', 'value' => 1, 'category' => 'Físico'],
        ];
    }

    /** Finer-grained words the quick picker was missing. */
    public static function nuanced(): array
    {
        return [
            ['key' => 'gratitud', 'emoji' => '🙏', 'text' => 'Gratitud', 'value' => 9, 'category' => 'Emocional'],
            ['key' => 'orgulloso', 'emoji' => '🏅', 'text' => 'Orgulloso', 'value' => 9, 'category' => 'Emocional'],
            ['key' => 'esperanzado', 'emoji' => '🌱', 'text' => 'Esperanzado', 'value' => 8, 'category' => 'Emocional'],
            ['key' => 'acompanado', 'emoji' => '🫂', 'text' => 'Acompañado', 'value' => 8, 'category' => 'Emocional'],
            ['key' => 'alivio', 'emoji' => '🍃', 'text' => 'Alivio', 'value' => 7, 'category' => 'Emocional'],
            ['key' => 'preocupacion', 'emoji' => '😟', 'text' => 'Preocupación', 'value' => 3, 'category' => 'Emocional'],
            ['key' => 'verguenza', 'emoji' => '😳', 'text' => 'Vergüenza', 'value' => 2, 'category' => 'Emocional'],
            ['key' => 'culpa', 'emoji' => '😔', 'text' => 'Culpa', 'value' => 2, 'category' => 'Emocional'],
            ['key' => 'decepcionado', 'emoji' => '😞', 'text' => 'Decepcionado', 'value' => 2, 'category' => 'Emocional'],
            ['key' => 'soledad', 'emoji' => '🌑', 'text' => 'Soledad', 'value' => 2, 'category' => 'Emocional'],
        ];
    }

    /** The categories the settings form offers; kept fixed for compatibility. */
    public static function categories(): array
    {
        return ['Emocional', 'Mental', 'Físico'];
    }
}
