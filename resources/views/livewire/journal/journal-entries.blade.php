<x-module-shell module="journal">
    <x-slot:actions>
        <x-date-navigator :date="$selectedDate" format="l d M Y" />
    </x-slot:actions>

    <div class="md-module-workspace journal-workspace">
        <div class="md-module-primary">

    {{-- Editor --}}
    <div class="md-card-elevated mb-3" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px;" class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
                @if ($hasEntry)
                    <i class="bi bi-check-circle-fill" style="color: var(--md-custom-color-success);"></i>
                @else
                    <i class="bi bi-circle" style="color: var(--md-sys-color-outline);"></i>
                @endif
                <span class="md-title-small" style="color: var(--md-sys-color-on-surface);">Entrada del día</span>
            </div>
        </div>
        <div style="padding: 0 16px 16px 16px;">
            @include('partials.markdown-editor', [
                'model' => 'text',
                'mode' => 'viewMode',
                'modeValue' => $viewMode,
                'content' => $text,
                'id' => 'journal-text',
                'placeholder' => '¿Cómo fue tu día? Escribe tus pensamientos aquí...',
                'rows' => 12,
            ])
        </div>
        <div style="padding: 8px 16px 12px 16px; border-top: 1px solid var(--md-sys-color-surface-variant);" class="d-flex justify-content-between align-items-center">
            <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">
                {{ str_word_count($text) }} palabras · {{ strlen($text) }} caracteres
            </span>
            <button wire:click="save" class="md-btn-filled" style="height: 36px; padding: 0 20px;">
                <i class="bi bi-floppy"></i> Guardar
            </button>
        </div>
    </div>

    {{-- Recent Entries --}}
    <div class="md-card-elevated" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px 16px 8px 16px;">
            <h3 class="md-title-small mb-0" style="color: var(--md-sys-color-on-surface);">
                <i class="bi bi-clock-history" style="color: var(--md-sys-color-on-surface-variant);"></i> Entradas recientes
            </h3>
        </div>
        @forelse ($recentEntries as $entry)
            <div wire:click="$set('selectedDate', '{{ $entry->date->format('Y-m-d') }}'); loadEntry()"
                 class="md-list-item"
                 style="cursor: pointer; {{ $entry->date->format('Y-m-d') === $selectedDate ? 'background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);' : '' }}">
                <div class="md-list-item-leading">
                    <div class="text-center" style="min-width: 40px;">
                        <div class="md-title-medium" style="color: var(--md-sys-color-primary);">{{ $entry->date->format('d') }}</div>
                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $entry->date->translatedFormat('M') }}</span>
                    </div>
                </div>
                <div class="md-list-item-content">
                    <div class="md-list-item-headline text-truncate">{{ Str::limit($entry->text, 80) }}</div>
                    @if ($entry->display_time)
                        <div class="md-list-item-supporting">{{ $entry->display_time }}</div>
                    @endif
                </div>
            </div>
        @empty
            <div class="text-center py-4" style="color: var(--md-sys-color-on-surface-variant);">
                <p class="md-body-medium mb-0">Sin entradas recientes</p>
            </div>
        @endforelse
    </div>
        </div>

        <livewire:journal.journal-mood-rail :selected-date="$selectedDate" :key="'journal-context-'.$selectedDate" />
    </div>
</x-module-shell>
