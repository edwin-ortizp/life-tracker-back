<?php

namespace App\Livewire\Meal;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\MealPlanEntry;
use Carbon\Carbon;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Comidas')]
class MealWeekly extends Component
{
    use HasUrlDate;

    public bool $showForm = false;
    public string $formDate = '';
    public string $formMealType = '';
    public string $formName = '';
    public string $formNotes = '';
    public ?int $formCalories = null;
    public ?int $editingId = null;

    public array $mealTypes = [
        'desayuno' => 'Desayuno',
        'almuerzo' => 'Almuerzo',
        'comida' => 'Comida',
        'merienda' => 'Merienda',
        'cena' => 'Cena',
    ];

    public function mount()
    {
        $this->initializeSelectedDate();
    }

    public function previousWeek()
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->subWeek()->toDateString();
    }

    public function nextWeek()
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->addWeek()->toDateString();
    }

    public function thisWeek()
    {
        $this->selectedDate = now()->toDateString();
    }

    public function openForm(string $date, string $mealType)
    {
        $existing = MealPlanEntry::where('date', $date)
            ->where('meal_type', $mealType)
            ->first();

        if ($existing) {
            $this->editingId = $existing->id;
            $this->formName = $existing->name ?? '';
            $this->formNotes = $existing->notes ?? '';
            $this->formCalories = $existing->calories;
        } else {
            $this->editingId = null;
            $this->formName = '';
            $this->formNotes = '';
            $this->formCalories = null;
        }

        $this->formDate = $date;
        $this->formMealType = $mealType;
        $this->showForm = true;
    }

    public function closeForm()
    {
        $this->showForm = false;
        $this->editingId = null;
    }

    public function save()
    {
        if (empty(trim($this->formName))) return;

        if ($this->editingId) {
            $entry = MealPlanEntry::find($this->editingId);
            if ($entry) {
                $entry->update([
                    'name' => trim($this->formName),
                    'notes' => $this->formNotes ?: null,
                    'calories' => $this->formCalories,
                ]);
            }
        } else {
            MealPlanEntry::create([
                'date' => $this->formDate,
                'meal_type' => $this->formMealType,
                'name' => trim($this->formName),
                'notes' => $this->formNotes ?: null,
                'calories' => $this->formCalories,
            ]);
        }

        $this->closeForm();
    }

    public function delete(int $id)
    {
        MealPlanEntry::where('id', $id)->delete();
    }

    public function render()
    {
        $weekStart = Carbon::parse($this->selectedDate)->startOfWeek();
        $weekDates = [];
        for ($i = 0; $i < 7; $i++) {
            $weekDates[] = $weekStart->copy()->addDays($i);
        }

        $entries = MealPlanEntry::whereBetween('date', [
            $weekStart->toDateString(),
            $weekStart->copy()->endOfWeek()->toDateString(),
        ])->get()->groupBy(fn($e) => $e->date->format('Y-m-d') . '|' . $e->meal_type);

        return view('livewire.meal.meal-weekly', [
            'weekDates' => $weekDates,
            'entries' => $entries,
            'weekStart' => $weekStart,
        ]);
    }
}
