<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use App\Support\Habits\HabitAction as HabitActionHandler;
use App\Support\Habits\HabitActionRegistry;
use Illuminate\Database\Eloquent\Model;

/**
 * Lo que hace un hábito al completarse: con qué módulo se relaciona, si registra
 * solo (auto) o pregunta antes (prompt), y con qué valores.
 */
class HabitAction extends Model
{
    use BelongsToUser;

    public const MODE_AUTO = 'auto';

    public const MODE_PROMPT = 'prompt';

    public const MODES = [
        self::MODE_AUTO => 'Con un valor por defecto',
        self::MODE_PROMPT => 'Preguntarme al completarlo',
    ];

    protected $fillable = [
        'habit_id',
        'action_key',
        'mode',
        'config',
        'enabled',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'enabled' => 'boolean',
        ];
    }

    public function habit()
    {
        return $this->belongsTo(HabitDefinition::class, 'habit_id');
    }

    /** El manejador del registry, o null si la acción ya no está registrada. */
    public function handler(): ?HabitActionHandler
    {
        return app(HabitActionRegistry::class)->find($this->action_key);
    }

    public function asksForInput(): bool
    {
        return $this->mode === self::MODE_PROMPT && $this->handler()?->promptFields() !== [];
    }
}
