<?php

namespace App\Livewire\Health;

use App\Models\HealthEvent;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Mapa corporal')]
class HealthBodyMap extends Component
{
    #[Url(as: 'period', history: true, keep: true)]
    public string $period = '90';

    public function mount(): void
    {
        $this->normalizePeriod();
    }

    public function updatedPeriod(): void
    {
        $this->normalizePeriod();
    }

    public function render()
    {
        $symptoms = HealthEvent::query()->where('type', 'symptom');

        if ($this->period !== 'all') {
            $symptoms->whereDate('event_date', '>=', today()->subDays((int) $this->period - 1));
        }

        $stats = collect(HealthEvent::BODY_AREAS)
            ->except('other')
            ->map(fn () => ['count' => 0, 'severity' => 0]);

        $symptoms->get()->each(function (HealthEvent $event) use ($stats): void {
            $area = $event->details['body_area'] ?? null;

            if (! $area || ! $stats->has($area)) {
                return;
            }

            $stats[$area] = [
                'count' => $stats[$area]['count'] + 1,
                'severity' => $stats[$area]['severity'] + ($event->details['severity'] ?? 1),
            ];
        });

        $maximumSeverity = max(1, $stats->max('severity'));

        return view('livewire.health.health-body-map', [
            'areas' => $stats,
            'maximumSeverity' => $maximumSeverity,
            'totalSymptoms' => $stats->sum('count'),
        ]);
    }

    private function normalizePeriod(): void
    {
        if (! in_array($this->period, ['30', '90', 'all'], true)) {
            $this->period = '90';
        }
    }
}
