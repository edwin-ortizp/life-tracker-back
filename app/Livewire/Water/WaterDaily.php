<?php

namespace App\Livewire\Water;

use App\Models\DrinkLog;
use App\Models\DrinkType;
use Carbon\Carbon;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Hidratación')]
class WaterDaily extends Component
{
    public string $selectedDate;
    public int $dailyGoal = 2500;

    // Form fields
    public string $drinkTypeId = '';
    public int $amount = 250;
    public bool $showForm = false;
    public ?string $editingId = null;

    public function mount()
    {
        $this->selectedDate = now()->toDateString();
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
        if ($id) {
            $log = DrinkLog::find($id);
            if ($log) {
                $this->editingId = $id;
                $this->drinkTypeId = $log->drink_type_id ?? '';
                $this->amount = $log->amount;
            }
        } else {
            $this->editingId = null;
            $this->drinkTypeId = '';
            $this->amount = 250;
        }
        $this->showForm = true;
    }

    public function closeForm()
    {
        $this->showForm = false;
        $this->editingId = null;
        $this->resetForm();
    }

    public function quickAdd(string $drinkTypeId, int $amount)
    {
        $drinkType = DrinkType::find($drinkTypeId);
        if (!$drinkType) return;

        $hydrationValue = (int) round($amount * $drinkType->hydration_factor);
        $now = now();

        DrinkLog::create([
            'date' => $this->selectedDate,
            'drink_type' => $drinkType->name,
            'amount' => $amount,
            'hydration_value' => $hydrationValue,
            'time' => $now->format('H:i'),
            'timestamp' => $now->timestamp,
            'drink_type_id' => $drinkTypeId,
        ]);
    }

    public function save()
    {
        $drinkType = DrinkType::find($this->drinkTypeId);
        if (!$drinkType || $this->amount <= 0) return;

        $hydrationValue = (int) round($this->amount * $drinkType->hydration_factor);
        $now = now();

        if ($this->editingId) {
            $log = DrinkLog::find($this->editingId);
            if ($log) {
                $log->update([
                    'drink_type' => $drinkType->name,
                    'amount' => $this->amount,
                    'hydration_value' => $hydrationValue,
                    'drink_type_id' => $this->drinkTypeId,
                ]);
            }
        } else {
            DrinkLog::create([
                'date' => $this->selectedDate,
                'drink_type' => $drinkType->name,
                'amount' => $this->amount,
                'hydration_value' => $hydrationValue,
                'time' => $now->format('H:i'),
                'timestamp' => $now->timestamp,
                'drink_type_id' => $this->drinkTypeId,
            ]);
        }

        $this->closeForm();
    }

    public function delete(string $id)
    {
        DrinkLog::where('id', $id)->delete();
    }

    private function resetForm()
    {
        $this->drinkTypeId = '';
        $this->amount = 250;
    }

    public function render()
    {
        $logs = DrinkLog::where('date', $this->selectedDate)
            ->orderByDesc('timestamp')
            ->get();

        $totalHydration = $logs->sum('hydration_value');
        $totalAmount = $logs->sum('amount');
        $drinkTypes = DrinkType::orderBy('name')->get();
        $percentage = $this->dailyGoal > 0 ? min(($totalHydration / $this->dailyGoal) * 100, 100) : 0;

        return view('livewire.water.water-daily', [
            'logs' => $logs,
            'totalHydration' => $totalHydration,
            'totalAmount' => $totalAmount,
            'drinkTypes' => $drinkTypes,
            'percentage' => $percentage,
        ]);
    }
}
