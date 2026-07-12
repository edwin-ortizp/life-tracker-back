<div>
    {{-- Header with date navigation --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-journal-text text-purple"></i> Diario</h4>
        <div class="d-flex align-items-center gap-2">
            <button wire:click="previousDay" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-chevron-left"></i>
            </button>
            <button wire:click="today" class="btn btn-sm {{ $selectedDate === now()->toDateString() ? 'btn-primary' : 'btn-outline-primary' }}">
                Hoy
            </button>
            <span class="fw-medium">{{ \Carbon\Carbon::parse($selectedDate)->translatedFormat('l d M Y') }}</span>
            <button wire:click="nextDay" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-chevron-right"></i>
            </button>
        </div>
    </div>

    {{-- Editor --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
                @if ($hasEntry)
                    <i class="bi bi-check-circle-fill text-success"></i>
                @else
                    <i class="bi bi-circle text-muted"></i>
                @endif
                Entrada del día
            </h6>
            <div class="btn-group btn-group-sm">
                <button wire:click="$set('viewMode', 'write')" class="btn {{ $viewMode === 'write' ? 'btn-primary' : 'btn-outline-primary' }}">
                    <i class="bi bi-pencil"></i> Escribir
                </button>
                <button wire:click="$set('viewMode', 'preview')" class="btn {{ $viewMode === 'preview' ? 'btn-primary' : 'btn-outline-primary' }}">
                    <i class="bi bi-eye"></i> Vista previa
                </button>
            </div>
        </div>
        <div class="card-body">
            @if ($viewMode === 'write')
                <textarea wire:model="text"
                          class="form-control border-0"
                          rows="12"
                          placeholder="¿Cómo fue tu día? Escribe tus pensamientos aquí..."
                          style="resize: vertical; font-family: 'Segoe UI', sans-serif; line-height: 1.8;"></textarea>
            @else
                <div class="p-3" style="min-height: 200px; line-height: 1.8;">
                    @if (empty(trim($text)))
                        <p class="text-muted text-center">Sin contenido</p>
                    @else
                        {!! nl2br(e($text)) !!}
                    @endif
                </div>
            @endif
        </div>
        <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
            <small class="text-muted">
                {{ str_word_count($text) }} palabras · {{ strlen($text) }} caracteres
            </small>
            <button wire:click="save" class="btn btn-sm btn-primary">
                <i class="bi bi-floppy"></i> Guardar
            </button>
        </div>
    </div>

    {{-- Recent Entries --}}
    <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-clock-history"></i> Entradas recientes</h6>
        </div>
        <div class="card-body pt-0">
            @forelse ($recentEntries as $entry)
                <div wire:click="$set('selectedDate', '{{ $entry->date->format('Y-m-d') }}'); loadEntry()"
                     class="d-flex align-items-center gap-3 p-2 rounded mb-1 {{ $entry->date->format('Y-m-d') === $selectedDate ? 'bg-primary bg-opacity-10' : '' }}"
                     style="cursor: pointer;">
                    <div class="text-center" style="min-width: 45px;">
                        <div class="fw-bold text-primary">{{ $entry->date->format('d') }}</div>
                        <small class="text-muted">{{ $entry->date->translatedFormat('M') }}</small>
                    </div>
                    <div class="flex-grow-1 min-w-0">
                        <p class="mb-0 text-truncate small">{{ Str::limit($entry->text, 80) }}</p>
                        @if ($entry->display_time)
                            <small class="text-muted">{{ $entry->display_time }}</small>
                        @endif
                    </div>
                </div>
            @empty
                <p class="text-muted text-center mb-0">Sin entradas recientes</p>
            @endforelse
        </div>
    </div>
</div>
