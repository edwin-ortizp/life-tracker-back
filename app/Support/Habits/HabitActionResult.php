<?php

namespace App\Support\Habits;

use Illuminate\Database\Eloquent\Model;

/** Lo que dejó una acción de hábito: el registro creado y cómo contárselo al usuario. */
class HabitActionResult
{
    public function __construct(
        public readonly ?Model $record,
        public readonly string $message,
    ) {}
}
