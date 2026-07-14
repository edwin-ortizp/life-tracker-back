@php
    $markdownHtml = Illuminate\Support\Str::markdown($content, [
        'html_input' => 'strip',
        'allow_unsafe_links' => false,
    ]);
@endphp

<div class="md-markdown-editor">
    <div class="md-markdown-editor-toolbar">
        <span class="md-label-small"><i class="bi bi-markdown"></i> Markdown</span>
        <div class="md-chip-group">
            <button type="button" wire:click="$set('{{ $mode }}', 'write')" class="md-chip md-chip-filter {{ $modeValue === 'write' ? 'selected' : '' }}">
                <i class="bi bi-pencil"></i> Editar
            </button>
            <button type="button" wire:click="$set('{{ $mode }}', 'preview')" class="md-chip md-chip-filter {{ $modeValue === 'preview' ? 'selected' : '' }}">
                <i class="bi bi-eye"></i> Vista previa
            </button>
        </div>
    </div>

    @if ($modeValue === 'write')
        <textarea wire:model.live.debounce.250ms="{{ $model }}" class="md-markdown-editor-input" id="{{ $id }}" rows="{{ $rows ?? 5 }}" placeholder="{{ $placeholder }}"></textarea>
    @else
        <div class="md-markdown-preview">
            @if (blank(trim($content)))
                <p class="md-markdown-empty">Sin contenido para previsualizar.</p>
            @else
                {!! $markdownHtml !!}
            @endif
        </div>
    @endif
</div>
