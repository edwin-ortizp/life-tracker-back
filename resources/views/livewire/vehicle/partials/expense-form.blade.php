<x-ui.form-dialog :open="$showExpenseForm" close="closeExpenseForm" submit-action="saveExpense" id="vehicle-expense-dialog"
                  :title="$editingExpenseId ? 'Editar gasto' : 'Registrar gasto'" icon="bi-wallet2"
                  :submit="$editingExpenseId ? 'Guardar cambios' : 'Guardar gasto'">
    <div class="d-flex flex-column gap-3">
        <p class="md-body-small mb-0">Seguros, llantas, pintura y todo lo que no sea combustible ni mantenimiento.</p>
        <div class="md-field-pair">
            <x-ui.select name="expenseCategoryId" label="Categoría" placeholder="Selecciona una categoría" :required="true" icon="bi-tag"
                         :options="$categoryOptions" :selected="$expenseCategoryId" wire:model="expenseCategoryId"
                         :help="$categoryOptions === [] ? 'Crea tus categorías desde «Gestionar categorías» en el historial.' : null" />
            <x-ui.field name="expenseAmount" label="Valor" type="number" min="0" step=".01" :required="true" icon="bi-cash" wire:model="expenseAmount" />
        </div>
        <x-ui.field name="expenseDescription" label="Descripción" maxlength="255" help="Ej. Cuota seguro todo riesgo, llanta de repuesto" wire:model="expenseDescription" />
        <div class="md-field-pair">
            <x-ui.field name="expenseDate" label="Fecha" type="date" :required="true" wire:model="expenseDate" />
            <x-ui.field name="expenseUsageReading" :label="'Lectura ('.($vehicle->usage_unit ?: 'uso').')'" type="number" min="0" step=".01" icon="bi-speedometer2" wire:model="expenseUsageReading" />
        </div>
        <x-ui.field name="expenseProvider" label="Proveedor" maxlength="120" icon="bi-shop" wire:model="expenseProvider" />
    </div>
</x-ui.form-dialog>
