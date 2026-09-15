<?php

namespace App\Livewire\Exercise;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\ExerciseLog;
use App\Models\ExerciseType;
use Carbon\Carbon;
use Livewire\Component;
use App\Livewire\Concerns\WithDefaultDateFilter;
use App\Livewire\Concerns\WithManagementCard;
use Livewire\Attributes\Url;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Ejercicio')]
class ExerciseDaily extends Component
{
    use HasUrlDate;
    use WithManagementCard;
    use WithDefaultDateFilter;

    #[Url(as: 'q', history: true, except: '')]
    public string $search = '';

    #[Url(as: 'type', history: true, except: '')]
    public string $typeFilter = '';

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
        $this->setDateScope($this->dateScope);
    }

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function applyFilters(string $scope, string $type): void
    {
        $this->setDateScope($scope);
        $this->typeFilter = $type !== '' && ExerciseType::whereKey($type)->exists() ? $type : '';
        $this->resetPage();
    }

    public function removeFilter(string $key, ?string $value = null): void
    {
        $this->resetPage();
        match ($key) {
            'date' => $this->dateScope = 'all',
            'type' => $this->typeFilter = '',
            default => null,
        };
    }

    public function clearFilters(): void
    {
        $this->resetPage();
        $this->dateScope = 'all';
        $this->typeFilter = '';
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
                // Editar desde «Todas las fechas» no mueve el registro al día seleccionado.
                unset($data['date']);
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
        $dayLogs = ExerciseLog::where('date', $this->selectedDate);
        $search = trim($this->search);
        $logs = $this->applyDateScope(ExerciseLog::query())
            ->with('exerciseType')
            ->when($search !== '', fn ($q) => $q->where(fn ($inner) => $inner
                ->whereHas('exerciseType', fn ($type) => $type->where('name', 'like', '%'.$search.'%'))
                ->orWhere('notes', 'like', '%'.$search.'%')))
            ->when($this->typeFilter !== '', fn ($q) => $q->where('exercise_type_id', $this->typeFilter))
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->paginate($this->perPage());

        $exerciseTypes = ExerciseType::orderBy('name')->get();
        $typeFilterLabel = $this->typeFilter !== '' ? $exerciseTypes->firstWhere('id', $this->typeFilter)?->name : null;
        $activeFilters = $this->dateFilterChips();
        if ($typeFilterLabel) {
            $activeFilters[] = ['key' => 'type', 'value' => null, 'label' => 'Tipo: '.$typeFilterLabel, 'icon' => 'bi-tag'];
        }

        // Los totales del día no dependen de la página visible.
        $totalCalories = (clone $dayLogs)->sum('calories');
        $totalDuration = (clone $dayLogs)->sum('duration');
        $totalSteps = (clone $dayLogs)->sum('steps');

        return view('livewire.exercise.exercise-daily', [
            'logs' => $logs,
            'totalLogs' => ExerciseLog::count(),
            'activeFilters' => $activeFilters,
            'dateScopes' => $this->dateScopeOptions(),
            'exerciseTypes' => $exerciseTypes,
            'totalCalories' => $totalCalories,
            'totalDuration' => $totalDuration,
            'totalSteps' => $totalSteps,
        ]);
    }
}
