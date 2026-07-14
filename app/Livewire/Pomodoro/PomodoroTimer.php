<?php

namespace App\Livewire\Pomodoro;

use App\Livewire\Concerns\HasUrlDate;
use App\Models\ModuleSetting;
use App\Models\PomodoroSession;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\Validator;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Pomodoro')]
class PomodoroTimer extends Component
{
    use HasUrlDate;

    public int $workDuration = 25;

    public int $shortBreak = 5;

    public int $longBreak = 15;

    public int $weekdayGoal = 300;

    public int $weekendGoal = 120;

    public int $manualHours = 0;

    public int $manualMinutes = 30;

    public string $manualDescription = '';

    public function mount(): void
    {
        $this->initializeSelectedDate();

        $setting = ModuleSetting::firstOrCreate(
            ['module' => 'pomodoro'],
            ['settings' => [
                'weekday_goal_minutes' => 300,
                'weekend_goal_minutes' => 120,
            ]],
        );

        $this->weekdayGoal = (int) ($setting->settings['weekday_goal_minutes'] ?? 300);
        $this->weekendGoal = (int) ($setting->settings['weekend_goal_minutes'] ?? 120);
    }

    public function saveSession(int $duration, string $description = ''): void
    {
        Validator::make([
            'duration' => $duration,
            'description' => $description,
        ], [
            'duration' => ['required', 'integer', 'min:60', 'max:86400'],
            'description' => ['nullable', 'string', 'max:1000'],
        ])->validate();

        $now = now();

        PomodoroSession::create([
            'date' => $now->toDateString(),
            'start_time' => ['timestamp' => $now->copy()->subSeconds($duration)->timestamp],
            'end_time' => ['timestamp' => $now->timestamp],
            'duration' => $duration,
            'completed' => true,
            'description' => trim($description) ?: null,
        ]);

        $this->selectedDate = $now->toDateString();
    }

    public function saveManualSession(): void
    {
        $validated = $this->validate([
            'selectedDate' => ['required', 'date_format:Y-m-d'],
            'manualHours' => ['required', 'integer', 'min:0', 'max:16'],
            'manualMinutes' => ['required', 'integer', 'min:0', 'max:59'],
            'manualDescription' => ['nullable', 'string', 'max:1000'],
        ]);

        $duration = ($validated['manualHours'] * 3600) + ($validated['manualMinutes'] * 60);

        if ($duration === 0) {
            $this->addError('manualMinutes', 'Registra al menos un minuto de trabajo.');

            return;
        }

        $date = Carbon::parse($this->selectedDate)->startOfDay();
        $end = $date->isToday() ? now() : $date->copy()->endOfDay();

        PomodoroSession::create([
            'date' => $date->toDateString(),
            'start_time' => ['timestamp' => $end->copy()->subSeconds($duration)->timestamp],
            'end_time' => ['timestamp' => $end->timestamp],
            'duration' => $duration,
            'completed' => true,
            'description' => trim($validated['manualDescription']) ?: null,
        ]);

        $this->manualHours = 0;
        $this->manualMinutes = 30;
        $this->manualDescription = '';
    }

    public function deleteSession(string $id): void
    {
        PomodoroSession::findOrFail($id)->delete();
    }

    public function saveGoals(): void
    {
        $validated = $this->validate([
            'weekdayGoal' => ['required', 'integer', 'min:0', 'max:1440'],
            'weekendGoal' => ['required', 'integer', 'min:0', 'max:1440'],
        ]);

        $setting = ModuleSetting::firstOrCreate(['module' => 'pomodoro']);
        $setting->update([
            'settings' => array_merge($setting->settings ?? [], [
                'weekday_goal_minutes' => $validated['weekdayGoal'],
                'weekend_goal_minutes' => $validated['weekendGoal'],
            ]),
        ]);
    }

    public function previousDay(): void
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->subDay()->toDateString();
    }

    public function nextDay(): void
    {
        $this->selectedDate = Carbon::parse($this->selectedDate)->addDay()->toDateString();
    }

    public function today(): void
    {
        $this->selectedDate = now()->toDateString();
    }

    public function render()
    {
        $selectedDate = Carbon::parse($this->selectedDate)->startOfDay();
        $todaySessions = PomodoroSession::whereDate('date', $selectedDate)
            ->where('completed', true)
            ->get()
            ->sortByDesc(fn (PomodoroSession $session) => $session->end_time['timestamp'] ?? 0)
            ->values();

        $totalSeconds = (int) $todaySessions->sum('duration');
        $totalMinutes = intdiv($totalSeconds, 60);
        $sessionCount = $todaySessions->count();
        $dailyGoal = $this->goalFor($selectedDate);
        $progressPercentage = $dailyGoal > 0 ? (int) round(($totalMinutes / $dailyGoal) * 100) : 0;

        $weekStart = $selectedDate->copy()->startOfWeek(Carbon::MONDAY);
        $weekDates = collect(range(0, 6))->map(fn (int $offset) => $weekStart->copy()->addDays($offset));
        $weekSessions = PomodoroSession::query()
            ->where('completed', true)
            ->whereBetween('date', [$weekStart->toDateString(), $weekStart->copy()->endOfWeek()->toDateString()])
            ->get(['date', 'duration'])
            ->groupBy(fn (PomodoroSession $session) => $session->date->toDateString());

        $weekDays = $weekDates->map(function (Carbon $date) use ($weekSessions): array {
            $seconds = (int) ($weekSessions->get($date->toDateString())?->sum('duration') ?? 0);
            $minutes = intdiv($seconds, 60);
            $goal = $this->goalFor($date);

            return [
                'date' => $date,
                'minutes' => $minutes,
                'goal' => $goal,
                'percentage' => $goal > 0 ? (int) round(($minutes / $goal) * 100) : 0,
            ];
        });

        $month = $selectedDate->copy()->startOfMonth();
        $monthGridStart = $month->copy()->startOfWeek(Carbon::MONDAY);
        $monthGridEnd = $month->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY);
        $monthSessions = PomodoroSession::query()
            ->where('completed', true)
            ->whereBetween('date', [$monthGridStart->toDateString(), $monthGridEnd->toDateString()])
            ->get(['date', 'duration'])
            ->groupBy(fn (PomodoroSession $session) => $session->date->toDateString());
        $monthDays = collect(CarbonPeriod::create($monthGridStart, $monthGridEnd))->map(function (Carbon $date) use ($month, $monthSessions, $selectedDate): array {
            $minutes = intdiv((int) ($monthSessions->get($date->toDateString())?->sum('duration') ?? 0), 60);
            $goal = $this->goalFor($date);

            return [
                'date' => $date->copy(),
                'minutes' => $minutes,
                'percentage' => $goal > 0 ? min((int) round(($minutes / $goal) * 100), 100) : 0,
                'completed' => $goal > 0 && $minutes >= $goal,
                'in_month' => $date->month === $month->month,
                'selected' => $date->isSameDay($selectedDate),
            ];
        });

        return view('livewire.pomodoro.pomodoro-timer', [
            'todaySessions' => $todaySessions,
            'displayDate' => $selectedDate,
            'weekStart' => $weekStart,
            'weekDays' => $weekDays,
            'dailyGoal' => $dailyGoal,
            'totalSeconds' => $totalSeconds,
            'totalMinutes' => $totalMinutes,
            'sessionCount' => $sessionCount,
            'progressPercentage' => $progressPercentage,
            'monthData' => [
                'label' => $month->translatedFormat('F Y'),
                'weeks' => $monthDays->chunk(7),
                'focus_minutes' => $monthDays->where('in_month', true)->sum('minutes'),
                'completed_days' => $monthDays->where('in_month', true)->where('completed', true)->count(),
            ],
        ]);
    }

    private function goalFor(Carbon $date): int
    {
        return $date->isWeekend() ? $this->weekendGoal : $this->weekdayGoal;
    }
}
