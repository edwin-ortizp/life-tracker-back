@props(['name', 'label' => 'Categoría', 'options' => [], 'placeholder' => 'Sin categoría', 'selected' => null, 'id' => null, 'required' => false, 'icon' => null])
@if (count($options) > 10)
    <x-ui.combobox :name="$name" :label="$label" :id="$id" :options="($required ? [] : ['' => $placeholder]) + $options" {{ $attributes }} />
@else
    <x-ui.select :name="$name" :label="$label" :id="$id" :options="$options" :placeholder="$placeholder" :selected="$selected" :required="$required" :icon="$icon" {{ $attributes }} />
@endif
