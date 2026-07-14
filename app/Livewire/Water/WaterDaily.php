<?php

namespace App\Livewire\Water;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\DrinkLog;
use App\Models\DrinkType;
use App\Support\WaterGoal;
use App\Support\WaterProgress;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Hidratación')]
class WaterDaily extends Component
{
    use HasUrlDate;
    public int $dailyGoal = 2500;

    // Form fields
    public string $drinkTypeId = '';
    public int $amount = 250;
    public bool $showForm = false;
    public ?string $editingId = null;

    // Drink catalog fields
    public bool $showCatalog = false;
    public bool $showDrinkTypeForm = false;
    public ?string $editingDrinkTypeId = null;
    public string $catalogDrinkName = '';
    public string $catalogDrinkIcon = '💧';
    public string $catalogHydrationFactor = '1.00';
    public string $catalogMessage = '';

    public function mount()
    {
        $this->initializeSelectedDate();
        $this->dailyGoal = WaterGoal::forUser(Auth::user());
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

    public function openCatalog(): void
    {
        $this->showCatalog = true;
        $this->catalogMessage = '';
    }

    public function closeCatalog(): void
    {
        $this->showCatalog = false;
        $this->showDrinkTypeForm = false;
        $this->resetDrinkTypeForm();
    }

    public function openDrinkTypeForm(?string $id = null): void
    {
        $this->resetDrinkTypeForm();

        if ($id && ($drinkType = DrinkType::find($id))) {
            $this->editingDrinkTypeId = $drinkType->id;
            $this->catalogDrinkName = $drinkType->name;
            $this->catalogDrinkIcon = $drinkType->icon ?: '💧';
            $this->catalogHydrationFactor = (string) $drinkType->hydration_factor;
        }

        $this->showDrinkTypeForm = true;
    }

    public function closeDrinkTypeForm(): void
    {
        $this->showDrinkTypeForm = false;
        $this->resetDrinkTypeForm();
    }

    public function saveDrinkType(): void
    {
        $this->catalogDrinkName = trim($this->catalogDrinkName);
        $this->catalogDrinkIcon = trim($this->catalogDrinkIcon);

        $drinkType = $this->editingDrinkTypeId
            ? DrinkType::find($this->editingDrinkTypeId)
            : new DrinkType();

        if (!$drinkType) {
            $this->catalogMessage = 'La bebida ya no está disponible.';
            $this->closeDrinkTypeForm();

            return;
        }

        $data = $this->validate([
            'catalogDrinkName' => [
                'required',
                'string',
                'max:255',
                Rule::unique('drink_types', 'name')
                    ->where(fn ($query) => $query->where('user_id', Auth::id()))
                    ->ignore($drinkType->id),
            ],
            'catalogDrinkIcon' => ['required', 'string', 'max:40'],
            'catalogHydrationFactor' => ['required', 'numeric', 'min:0', 'max:9.99'],
        ]);

        $drinkType->fill([
            'name' => $data['catalogDrinkName'],
            'icon' => $data['catalogDrinkIcon'],
            'hydration_factor' => $data['catalogHydrationFactor'],
        ])->save();

        $this->catalogMessage = $this->editingDrinkTypeId
            ? 'Bebida actualizada. Los registros históricos no se modificaron.'
            : 'Bebida creada.';
        $this->closeDrinkTypeForm();
    }

    public function deleteDrinkType(string $id): void
    {
        $drinkType = DrinkType::find($id);

        if (!$drinkType) {
            $this->catalogMessage = 'La bebida ya no está disponible.';

            return;
        }

        if (DrinkLog::where('drink_type_id', $drinkType->id)->exists()) {
            $this->catalogMessage = 'No se puede eliminar una bebida con registros históricos.';

            return;
        }

        $drinkType->delete();
        $this->catalogMessage = 'Bebida eliminada.';
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

    private function resetDrinkTypeForm(): void
    {
        $this->resetErrorBag();
        $this->editingDrinkTypeId = null;
        $this->catalogDrinkName = '';
        $this->catalogDrinkIcon = '💧';
        $this->catalogHydrationFactor = '1.00';
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
            'monthData' => WaterProgress::month(Carbon::parse($this->selectedDate), $this->dailyGoal),
        ]);
    }
}
