<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TaskCategory extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['key', 'name', 'icon', 'sort_order'];

    /** Catálogo del usuario autenticado como key => nombre, en su orden. */
    public static function options(): array
    {
        return static::query()->orderBy('sort_order')->orderBy('name')->pluck('name', 'key')->all();
    }

    /** Genera un key único para el usuario a partir del nombre. */
    public static function uniqueKey(string $name, int $userId): string
    {
        $base = Str::slug($name) ?: 'categoria';
        $key = $base;
        $suffix = 2;

        while (static::withoutGlobalScopes()->where('user_id', $userId)->where('key', $key)->exists()) {
            $key = $base.'-'.$suffix++;
        }

        return $key;
    }

    public function tasks()
    {
        // El scope de usuario de Task limita las tareas a las del dueño autenticado.
        return $this->hasMany(Task::class, 'category', 'key');
    }
}
