<?php

namespace App\Models\Traits;

use Illuminate\Validation\ValidationException;

/** Two-level, owner-scoped category trees. Also enforced for non-HTTP writes. */
trait HasCategoryHierarchy
{
    public static function bootHasCategoryHierarchy(): void
    {
        static::saving(function ($category) {
            $category->user_id ??= auth()->id();
            if (! $category->parent_id) {
                $category->parent_id = null;
                return;
            }
            $parent = static::withoutGlobalScopes()->where('user_id', $category->user_id)
                ->when($category instanceof \App\Models\UserCategory, fn ($q) => $q->where('domain', $category->domain))
                ->find($category->parent_id);
            if (! $parent || $parent->parent_id || $parent->is($category) || $category->children()->exists()) {
                throw ValidationException::withMessages(['parent_id' => 'Elige una categoría raíz de tu catálogo. Solo se permiten dos niveles.']);
            }
        });
        static::deleting(function ($category) {
            $category->ensureHasNoChildren();
        });
    }

    public function parent()
    {
        return $this->belongsTo(static::class, 'parent_id')->withoutGlobalScopes()->where('user_id', $this->user_id)
            ->when($this instanceof \App\Models\UserCategory, fn ($q) => $q->where('domain', $this->domain));
    }

    public function children()
    {
        return $this->hasMany(static::class, 'parent_id')->withoutGlobalScopes()->where('user_id', $this->user_id)
            ->when($this instanceof \App\Models\UserCategory, fn ($q) => $q->where('domain', $this->domain));
    }

    public function ensureHasNoChildren(): void
    {
        if ($this->children()->exists()) {
            throw ValidationException::withMessages(['parent_id' => 'Mueve primero las subcategorías antes de eliminar esta categoría.']);
        }
    }

    public function getPathLabelAttribute(): string
    {
        return $this->parent ? $this->parent->name.' / '.$this->name : $this->name;
    }

    public static function hierarchyOptions(int $userId, string $value = 'id', ?string $domain = null): array
    {
        $records = static::withoutGlobalScopes()->where('user_id', $userId)
            ->when($domain, fn ($q) => $q->where('domain', $domain))
            ->when(in_array(static::class, [\App\Models\TaskCategory::class, \App\Models\VehicleExpenseCategory::class]), fn ($q) => $q->orderBy('sort_order'))
            ->orderBy('name')->get();
        $options = [];
        foreach ($records->whereNull('parent_id') as $root) {
            $options[$root->$value] = $root->name;
            foreach ($records->where('parent_id', $root->id) as $child) {
                $options[$child->$value] = $root->name.' / '.$child->name;
            }
        }
        return $options;
    }

    public static function expandSelection(array $values, int $userId, string $value = 'id', ?string $domain = null): array
    {
        $query = static::withoutGlobalScopes()->where('user_id', $userId)
            ->when($domain, fn ($q) => $q->where('domain', $domain));
        $ids = (clone $query)->whereIn($value, $values)->pluck('id');
        return array_values(array_unique([...$values, ...$query->whereIn('parent_id', $ids)->pluck($value)->all()]));
    }
}
