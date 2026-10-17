<?php

namespace App\Livewire\Task;

class TaskEditor extends TaskList
{
    public string $filter = 'pending';
    public $categoryFilter = [];
    public string $priorityFilter = '';
    public string $dateFilter = '';
    public string $sizeFilter = '';
    public string $search = '';
    public ?string $editTask = null;

    public function mount(): void
    {
        if ($this->editTask) $this->openForm($this->editTask);
    }

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
        $fields = ['editingId', 'title', 'description', 'descriptionMode', 'category', 'statusId', 'priority', 'size', 'startDate', 'startTime', 'endDate', 'endTime', 'estimatedTime', 'isPrivate', 'isRecurrent', 'recurrenceIntervalDays', 'nativeRecurrenceRule', 'bulkTitles', 'editTask'];

        return view('livewire.task.task-editor', [
            'defaults' => array_intersect_key(get_class_vars(self::class), array_flip($fields)),
            'statusOptions' => \App\Models\TaskStatus::ensureFor(auth()->id())
                ->where('type', '!=', \App\Models\TaskStatus::DONE)->pluck('name', 'id')->all(),
        ]);
    }

    public function closeForm()
    {
        parent::closeForm();
        $this->dispatch('task-records-changed')->to(TaskList::class);
    }
}
