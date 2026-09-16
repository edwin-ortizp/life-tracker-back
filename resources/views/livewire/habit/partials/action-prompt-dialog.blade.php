{{--
    Lo que falta por saber cuando un hábito está configurado para «preguntarme al
    completarlo». El hábito ya quedó marcado: Omitir solo renuncia al registro.
--}}
<x-ui.form-dialog :open="$showHabitActionPrompt" close="skipHabitAction" submit-action="confirmHabitAction"
                  id="habit-action-prompt" icon="bi-link-45deg"
                  :title="$promptingHabitName !== '' ? 'Completaste «'.$promptingHabitName.'»' : 'Completar hábito'"
                  submit="Registrar">
    <div class="d-flex flex-column gap-3">
        <p class="md-body-medium mb-0">Cuéntame los detalles para dejarlo registrado. Si prefieres, puedes omitirlo.</p>

        @foreach ($habitActionFields as $field)
            <div wire:key="habit-prompt-{{ $field['key'] }}">
                @if ($field['type'] === 'select')
                    <x-ui.select :name="'habitActionInput.'.$field['key']" :label="$field['label']"
                                 :options="$field['options']" :selected="data_get($habitActionInput, $field['key'])"
                                 :help="$field['help']" wire:model="habitActionInput.{{ $field['key'] }}" />
                @else
                    <x-ui.field :name="'habitActionInput.'.$field['key']" :label="$field['label']"
                                :type="$field['type']" :help="$field['help']"
                                wire:model="habitActionInput.{{ $field['key'] }}" />
                @endif
            </div>
        @endforeach

        <div>
            <button type="button" class="md-btn-text" wire:click="skipHabitAction">Omitir por esta vez</button>
        </div>
    </div>
</x-ui.form-dialog>
