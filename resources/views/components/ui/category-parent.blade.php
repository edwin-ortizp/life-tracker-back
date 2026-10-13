@props(['model', 'editingId' => null, 'name' => 'parent_id'])
@php
    $class = 'App\\Models\\'.$model;
    $parents = $class::query()->where('user_id', auth()->id())->whereNull('parent_id')
        ->when($editingId, fn ($q) => $q->whereKeyNot($editingId))->orderBy('name')->pluck('name', 'id')->all();
    if ($editingId && $class::query()->where('user_id', auth()->id())->where('parent_id', $editingId)->exists()) {
        $parents = [];
    }
@endphp
<x-ui.category-select :name="$name" label="Categoría padre" placeholder="Sin padre" :options="$parents" wire:model="{{ $name }}" help="Solo se permiten dos niveles: padre e hija." />
