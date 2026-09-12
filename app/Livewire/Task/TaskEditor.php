<?php

namespace App\Livewire\Task;

class TaskEditor extends TaskList
{
    public function openForm(?string $id = null)
    {
        if ($id) \App\Models\Task::findOrFail($id);
        parent::openForm($id);
    }

    public function save(): void
    {
        $this->validate(['title' => ['required', 'string', 'max:255']]);
        parent::save();
    }

    public function render()
    {
        $fields = ['editingId', 'title', 'description', 'descriptionMode', 'category', 'priority', 'size', 'startDate', 'startTime', 'endDate', 'endTime', 'estimatedTime', 'isPrivate', 'isRecurrent', 'recurrenceIntervalDays', 'nativeRecurrenceRule', 'bulkTitles', 'editTask'];

        return view('livewire.task.task-editor', [
            'defaults' => array_intersect_key(get_class_vars(self::class), array_flip($fields)),
        ]);
    }

    public function closeForm()
    {
        parent::closeForm();
        $this->dispatch('task-records-changed')->to(TaskList::class);
    }
}
