<?php

namespace App\Livewire\Exercise;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\ExerciseLog;
use App\Models\ExerciseType;
use Carbon\Carbon;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Ejercicio')]
class ExerciseDaily extends Component
{
    use HasUrlDate;

    // Form
    public bool $showForm = false;
    public ?string $editingId = null;
    public string $exerciseTypeId = '';
    public ?int $sets = null;
    public ?int $reps = null;
    public ?int $duration = null;
    public ?float $distance = null;
    public ?float $weight = null;
    public ?int $calories = null;
    public ?int $steps = null;
    public string $notes = '';

    public function mount()
    {
        $this->initializeSelectedDate();
    }

    public function previousDay()
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->subDay()->toDateString();
    }

    public function nextDay()
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->addDay()->toDateString();
    }

    public function today()
    {
        $this->selectedDate = now()->toDateString();
    }

    public function openForm(?string $id = null)
    {
        $this->resetForm();

        if ($id) {
            $log = ExerciseLog::find($id);
            if ($log) {
                $this->editingId = $id;
                $this->exerciseTypeId = $log->exercise_type_id ?? '';
                $this->sets = $log->sets;
                $this->reps = $log->reps;
                $this->duration = $log->duration;
                $this->distance = $log->distance;
                $this->weight = $log->weight;
                $this->calories = $log->calories;
                $this->steps = $log->steps;
                $this->notes = $log->notes ?? '';
            }
        }

        $this->showForm = true;
    }

    public function closeForm()
    {
        $this->showForm = false;
        $this->editingId = null;
        $this->resetForm();
    }

    public function updatedExerciseTypeId()
    {
        if ($this->exerciseTypeId && !$this->editingId) {
            $type = ExerciseType::find($this->exerciseTypeId);
            if ($type && $this->duration && $type->calories_per_hour > 0) {
                $this->calories = (int) round(($this->duration / 60) * $type->calories_per_hour);
            }
            if ($type && $this->duration && $type->steps_equivalent > 0) {
                $this->steps = (int) round(($this->duration / 60) * $type->steps_equivalent);
            }
        }
    }

    public function updatedDuration()
    {
        if ($this->exerciseTypeId && $this->duration) {
            $type = ExerciseType::find($this->exerciseTypeId);
            if ($type && $type->calories_per_hour > 0) {
                $this->calories = (int) round(($this->duration / 60) * $type->calories_per_hour);
            }
            if ($type && $type->steps_equivalent > 0) {
                $this->steps = (int) round(($this->duration / 60) * $type->steps_equivalent);
            }
        }
    }

    public function save()
    {
        if (!$this->exerciseTypeId) return;

        $data = [
            'date' => $this->selectedDate,
            'exercise_type_id' => $this->exerciseTypeId,
            'sets' => $this->sets,
            'reps' => $this->reps,
            'duration' => $this->duration,
            'distance' => $this->distance,
            'weight' => $this->weight,
            'calories' => $this->calories,
            'steps' => $this->steps,
            'notes' => $this->notes ?: null,
        ];

        if ($this->editingId) {
            $log = ExerciseLog::find($this->editingId);
            if ($log) {
                $log->update($data);
            }
        } else {
            ExerciseLog::create($data);
        }

        $this->closeForm();
    }

    public function delete(string $id)
    {
        ExerciseLog::where('id', $id)->delete();
    }

    private function resetForm()
    {
        $this->exerciseTypeId = '';
        $this->sets = null;
        $this->reps = null;
        $this->duration = null;
        $this->distance = null;
        $this->weight = null;
        $this->calories = null;
        $this->steps = null;
        $this->notes = '';
    }

    public function render()
    {
        $logs = ExerciseLog::where('date', $this->selectedDate)
            ->with('exerciseType')
            ->orderByDesc('created_at')
            ->get();

        $exerciseTypes = ExerciseType::orderBy('name')->get();

        $totalCalories = $logs->sum('calories');
        $totalDuration = $logs->sum('duration');
        $totalSteps = $logs->sum('steps');

        return view('livewire.exercise.exercise-daily', [
            'logs' => $logs,
            'exerciseTypes' => $exerciseTypes,
            'totalCalories' => $totalCalories,
            'totalDuration' => $totalDuration,
            'totalSteps' => $totalSteps,
        ]);
    }
}
