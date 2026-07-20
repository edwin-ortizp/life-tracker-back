<div x-data="{ assistantOpen: $wire.entangle('show') }" class="d-inline-flex">
    <button type="button" wire:click="open" class="md-btn-filled-tonal">
        <i class="bi bi-magic"></i> Agregar varios
    </button>

    @teleport('body')
        <div x-show="assistantOpen" x-cloak>
            <div class="md-dialog-scrim" @click="$wire.close()"></div>
            <section class="md-dialog md-dialog--large ingredient-assistant" role="dialog" aria-modal="true" aria-labelledby="ingredient-assistant-title" @click.stop>
                <header class="md-dialog-header ingredient-assistant__header">
                    <div>
                        <span class="ingredient-assistant__eyebrow">
                            <i class="bi bi-stars"></i>
                            {{ $context === 'shopping' ? 'Asistente de compras' : 'Asistente de catálogo' }}
                        </span>
                        <h2 id="ingredient-assistant-title" class="md-headline-small mb-1">Agregar ingredientes en bloque</h2>
                        <p class="md-body-medium mb-0">
                            {{ $context === 'shopping' ? 'Los ingredientes confirmados quedarán listos para tu próxima compra.' : 'Crea ingredientes y equivalencias sin modificar tu lista de compras.' }}
                        </p>
                    </div>
                    <button type="button" wire:click="close" class="md-btn-icon" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
                </header>

                <div class="ingredient-assistant__progress" aria-label="Progreso">
                    <div class="ingredient-assistant__step {{ $step >= 1 ? 'is-active' : '' }}">
                        <span>1</span><div><strong>Dictar</strong><small>Tu lista libre</small></div>
                    </div>
                    <span class="ingredient-assistant__line {{ $step >= 2 ? 'is-active' : '' }}"></span>
                    <div class="ingredient-assistant__step {{ $step >= 2 ? 'is-active' : '' }}">
                        <span>2</span><div><strong>Revisar</strong><small>Coincidencias y nuevos</small></div>
                    </div>
                </div>

                <div class="md-dialog-content">
                    @if ($result !== null)
                        <div class="ingredient-assistant__success">
                            <span class="ingredient-assistant__success-icon"><i class="bi bi-check2"></i></span>
                            <div>
                                <h3 class="md-title-large mb-1">Lista procesada</h3>
                                <p class="md-body-medium mb-0">Los cambios se guardaron correctamente.</p>
                            </div>
                            <dl class="ingredient-assistant__summary">
                                <div><dt>Encontrados</dt><dd>{{ $result['found'] }}</dd></div>
                                <div><dt>Creados</dt><dd>{{ $result['created'] }}</dd></div>
                                <div><dt>Vinculados</dt><dd>{{ $result['linked'] }}</dd></div>
                                <div><dt>Ignorados</dt><dd>{{ $result['ignored'] }}</dd></div>
                                <div><dt>Conflictos</dt><dd>{{ $result['conflicts'] }}</dd></div>
                            </dl>
                        </div>
                    @elseif ($step === 1)
                        <div class="ingredient-assistant__input-layout">
                            <section>
                                <div class="md-text-field {{ $errors->has('input') ? 'md-error' : '' }}">
                                    <textarea wire:model="input" id="bulk-ingredient-input" rows="9" placeholder=" "></textarea>
                                    <label for="bulk-ingredient-input">Ingredientes</label>
                                    <div class="md-supporting-text">
                                        @error('input'){{ $message }}@else Separa con comas, punto y coma o saltos de línea.@enderror
                                    </div>
                                </div>
                            </section>
                            <aside class="ingredient-assistant__example">
                                <div class="ingredient-assistant__example-icon"><i class="bi bi-mic"></i></div>
                                <span class="md-label-large">Puedes dictar naturalmente</span>
                                <p>“Necesito comprar huevos, 2 leches, pan, arroz”</p>
                                <div class="ingredient-assistant__hint"><i class="bi bi-shield-check"></i> Solo se aceptan coincidencias exactas por nombre o alias.</div>
                            </aside>
                        </div>
                    @else
                        <div class="ingredient-assistant__review-head">
                            <div>
                                <h3 class="md-title-medium mb-1">Revisa {{ count($rows) }} {{ count($rows) === 1 ? 'resultado' : 'resultados' }}</h3>
                                <p class="md-body-small mb-0">Los términos nuevos necesitan una decisión antes de confirmar.</p>
                            </div>
                            <div class="ingredient-assistant__legend">
                                <span><i class="bi bi-check-circle-fill"></i> Encontrado</span>
                                <span><i class="bi bi-question-circle-fill"></i> Por resolver</span>
                            </div>
                        </div>

                        <div class="ingredient-assistant__rows">
                            @foreach ($rows as $index => $row)
                                <article wire:key="ingredient-import-row-{{ $row['normalized'] }}" class="ingredient-assistant-row is-{{ $row['status'] }}">
                                    <div class="ingredient-assistant-row__source">
                                        <span class="ingredient-assistant-row__status">
                                            <i class="bi bi-{{ str_starts_with($row['status'], 'matched') ? 'check2' : ($row['status'] === 'conflict' ? 'exclamation-lg' : 'question-lg') }}"></i>
                                        </span>
                                        <div>
                                            <strong>{{ $row['term'] }}</strong>
                                            @if ($row['quantity'] !== null)<span class="md-chip md-chip--small">× {{ $row['quantity'] }}</span>@endif
                                            <small>
                                                @if ($row['status'] === 'matched_name') Coincidencia por nombre
                                                @elseif ($row['status'] === 'matched_alias') Coincidencia por alias
                                                @elseif ($row['status'] === 'conflict') Coincidencia en conflicto
                                                @else No reconocido
                                                @endif
                                            </small>
                                        </div>
                                    </div>

                                    @if (str_starts_with($row['status'], 'matched'))
                                        <div class="ingredient-assistant-row__match">
                                            <i class="bi bi-arrow-right"></i>
                                            <span>{{ $row['item_name'] }}</span>
                                        </div>
                                    @elseif ($row['status'] === 'conflict')
                                        <div class="ingredient-assistant-row__resolution">
                                            <p class="md-body-small mb-2">Este término identifica más de un ingrediente: {{ collect($row['candidates'])->pluck('name')->join(', ') }}. Corrige los alias desde Ingredientes.</p>
                                            <label class="md-checkbox"><input type="radio" wire:model.live="rows.{{ $index }}.action" value="ignore"><span>Ignorar en esta carga</span></label>
                                            @error("rows.$index.action")<small class="text-danger">{{ $message }}</small>@enderror
                                        </div>
                                    @else
                                        <div class="ingredient-assistant-row__resolution">
                                            <div class="ingredient-assistant-row__actions">
                                                <label><input type="radio" wire:model.live="rows.{{ $index }}.action" value="create"> Crear nuevo</label>
                                                <label><input type="radio" wire:model.live="rows.{{ $index }}.action" value="link"> Usar existente</label>
                                                <label><input type="radio" wire:model.live="rows.{{ $index }}.action" value="ignore"> Ignorar</label>
                                            </div>
                                            @error("rows.$index.action")<small class="text-danger d-block mt-1">{{ $message }}</small>@enderror

                                            @if (($row['action'] ?? '') === 'create')
                                                <div class="ingredient-assistant-row__fields">
                                                    <div class="md-text-field {{ $errors->has("rows.$index.new_name") ? 'md-error' : '' }}">
                                                        <input type="text" wire:model="rows.{{ $index }}.new_name" placeholder=" " id="bulk-new-name-{{ $index }}">
                                                        <label for="bulk-new-name-{{ $index }}">Nombre *</label>
                                                    </div>
                                                    <div class="md-text-field {{ $errors->has("rows.$index.category") ? 'md-error' : '' }}">
                                                        <select wire:model="rows.{{ $index }}.category" id="bulk-category-{{ $index }}">
                                                            <option value="">Seleccionar</option>
                                                            @foreach ($categoryOptions as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach
                                                        </select>
                                                        <label for="bulk-category-{{ $index }}">Categoría *</label>
                                                    </div>
                                                    <div class="md-text-field">
                                                        <input type="text" wire:model="rows.{{ $index }}.unit" placeholder=" " id="bulk-unit-{{ $index }}">
                                                        <label for="bulk-unit-{{ $index }}">Unidad</label>
                                                    </div>
                                                </div>
                                                @error("rows.$index.new_name")<small class="text-danger">{{ $message }}</small>@enderror
                                                @error("rows.$index.category")<small class="text-danger">{{ $message }}</small>@enderror
                                            @elseif (($row['action'] ?? '') === 'link')
                                                <div class="md-text-field mt-3 {{ $errors->has("rows.$index.link_item_id") ? 'md-error' : '' }}">
                                                    <select wire:model="rows.{{ $index }}.link_item_id" id="bulk-link-{{ $index }}">
                                                        <option value="">Seleccionar ingrediente</option>
                                                        @foreach ($ingredientOptions as $item)<option value="{{ $item->id }}">{{ $item->name }}</option>@endforeach
                                                    </select>
                                                    <label for="bulk-link-{{ $index }}">Guardar «{{ $row['term'] }}» como alias de</label>
                                                    @error("rows.$index.link_item_id")<div class="md-supporting-text">{{ $message }}</div>@enderror
                                                </div>
                                            @endif
                                        </div>
                                    @endif
                                </article>
                            @endforeach
                        </div>

                        @error('aliases')<div class="ingredient-assistant__error"><i class="bi bi-exclamation-circle"></i> {{ $message }}</div>@enderror
                        @error('name')<div class="ingredient-assistant__error"><i class="bi bi-exclamation-circle"></i> {{ $message }}</div>@enderror
                    @endif
                </div>

                <footer class="md-dialog-actions">
                    @if ($result !== null)
                        <span class="md-dialog-actions__spacer"></span>
                        <button type="button" wire:click="close" class="md-btn-filled"><i class="bi bi-check-lg"></i> Listo</button>
                    @elseif ($step === 1)
                        <span class="md-dialog-actions__spacer"></span>
                        <button type="button" wire:click="close" class="md-btn-text">Cancelar</button>
                        <button type="button" wire:click="analyze" class="md-btn-filled"><i class="bi bi-arrow-right"></i> Revisar lista</button>
                    @else
                        <button type="button" wire:click="backToInput" class="md-btn-text"><i class="bi bi-arrow-left"></i> Volver</button>
                        <span class="md-dialog-actions__spacer"></span>
                        <button type="button" wire:click="close" class="md-btn-text">Cancelar</button>
                        <button type="button" wire:click="confirm" class="md-btn-filled"><i class="bi bi-check2-all"></i> Confirmar</button>
                    @endif
                </footer>
            </section>
        </div>
    @endteleport
</div>
