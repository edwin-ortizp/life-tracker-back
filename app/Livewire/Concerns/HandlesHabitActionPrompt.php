<?php

namespace App\Livewire\Concerns;

use App\Services\HabitGamificationService;
use Illuminate\Validation\ValidationException;

/**
 * El diálogo que pide los datos que faltan cuando un hábito está configurado para
 * «preguntarme al completarlo». Compartido por Hábitos e Inicio, que ofrecen el
 * mismo toggle.
 *
 * Omitir nunca desmarca el hábito: el registro en el otro módulo es opcional.
 */
trait HandlesHabitActionPrompt
{
    public bool $showHabitActionPrompt = false;

    public ?int $promptingHabitId = null;

    public string $promptingHabitName = '';

    /** @var array<int, array<string, mixed>> */
    public array $habitActionFields = [];

    /** @var array<string, mixed> */
    public array $habitActionInput = [];

    /**
     * @param  array<string, mixed>  $feedback  Lo que devolvió HabitGamificationService::toggle().
     * @return bool Si se abrió el diálogo.
     */
    protected function openHabitActionPrompt(int $habitId, string $name, array $feedback): bool
    {
        if (! ($feedback['requiresInput'] ?? false)) {
            return false;
        }

        $this->resetValidation();
        $this->promptingHabitId = $habitId;
        $this->promptingHabitName = $name;
        $this->habitActionFields = $feedback['promptFields'];
        $this->habitActionInput = collect($feedback['promptFields'])
            ->mapWithKeys(fn (array $field) => [$field['key'] => $field['default']])
            ->all();
        $this->showHabitActionPrompt = true;

        return true;
    }

    /** «Omitir»: el hábito queda completado, simplemente sin registro asociado. */
    public function skipHabitAction(): void
    {
        $this->closeHabitActionPrompt();
    }

    public function confirmHabitAction(HabitGamificationService $gamification): void
    {
        if (! $this->promptingHabitId) {
            $this->closeHabitActionPrompt();

            return;
        }

        try {
            $result = $gamification->resolveAction(
                $this->promptingHabitId,
                $this->selectedDate,
                $this->habitActionInput,
            );
        } catch (ValidationException $exception) {
            // Los errores llegan con la clave del campo; la vista los pinta en su sitio.
            foreach ($exception->errors() as $key => $messages) {
                $this->addError('habitActionInput.'.$key, $messages[0]);
            }

            return;
        }

        if ($result['actionResult']) {
            $this->dispatch('habit-action-registered', message: $result['actionResult']);
        }

        $this->closeHabitActionPrompt();
    }

    private function closeHabitActionPrompt(): void
    {
        $this->showHabitActionPrompt = false;
        $this->promptingHabitId = null;
        $this->promptingHabitName = '';
        $this->habitActionFields = [];
        $this->habitActionInput = [];
        $this->resetValidation();
    }
}
