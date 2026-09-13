<?php

namespace App\Livewire\Health;

use App\Models\HealthEvent;

/** Reuses the existing validated operations, with an independent render boundary. */
class HealthEditor extends HealthIndex
{
    public string $range = 'all';
    public string $status = 'all';
    public array $types = [];
    public string $zone = '';

    public function mount(bool $initialOpen = false, array $initialAreas = []): void
    {
        if ($initialOpen) {
            $this->openForm();
            if ($initialAreas !== []) {
                $this->type = 'symptom';
                $this->bodyAreas = $initialAreas;
            }
        }
    }

    public function openForm(?string $id = null): void
    {
        if ($id) HealthEvent::findOrFail($id);
        parent::openForm($id);
    }

    public const FORM_FIELDS = ['editingId', 'loggingEventId', 'editingLogId', 'recoveringEventId', 'reschedulingTaskId', 'type', 'title', 'eventDate', 'endDate', 'notes', 'bodyAreas', 'customBodyArea', 'initialIntensity', 'storedIntensity', 'illness', 'customIllness', 'provider', 'specialty', 'facility', 'vaccineName', 'vaccineDose', 'pendingTitle', 'pendingDate', 'rescheduleDate', 'logDate', 'logIntensity', 'logNotes', 'recoveryDate', 'recoveryIntensity'];

    public function render()
    {
        $defaults = array_intersect_key(get_class_vars(self::class), array_flip(self::FORM_FIELDS));
        foreach (['eventDate', 'pendingDate', 'logDate', 'recoveryDate'] as $field) {
            $defaults[$field] = today()->toDateString();
        }

        return view('livewire.health.health-editor', [
            'defaults' => $defaults,
            'typeLabels' => HealthEvent::TYPES,
            'bodyAreaOptions' => HealthEvent::groupedBodyAreas(),
            'commonIllnesses' => HealthEvent::COMMON_ILLNESSES,
            'intensityOptions' => array_combine(range(1, 10), range(1, 10)),
        ]);
    }

    public function closeForm(): void { parent::closeForm(); $this->saved(); }
    public function closeLogForm(): void { parent::closeLogForm(); $this->saved(); }
    public function closeRecoveryForm(): void { parent::closeRecoveryForm(); $this->saved(); }
    public function closeTaskForm(): void { parent::closeTaskForm(); $this->saved(); }
    public function closeRescheduleForm(): void { parent::closeRescheduleForm(); $this->saved(); }

    private function saved(): void
    {
        $this->dispatch('health-records-changed')->to(HealthIndex::class);
    }
}
