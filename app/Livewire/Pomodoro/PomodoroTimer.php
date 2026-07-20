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

    public string $manualStart = '';

    public string $manualEnd = '';

    public string $manualDescription = '';

    public function mount(): void
    {
        $this->initializeSelectedDate();

        $settings = ModuleSetting::where('module', 'pomodoro')->value('settings') ?? [];

        $this->workDuration = (int) ($settings['work_duration_minutes'] ?? 25);
        $this->shortBreak = (int) ($settings['short_break_minutes'] ?? 5);
        $this->longBreak = (int) ($settings['long_break_minutes'] ?? 15);
        $this->weekdayGoal = (int) ($settings['weekday_goal_minutes'] ?? 300);
        $this->weekendGoal = (int) ($settings['weekend_goal_minutes'] ?? 120);
    }

    public function saveSession(int $startedAt, int $endedAt, string $description, string $clientToken): void
    {
        $validated = Validator::make([
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
            'description' => $description,
            'client_token' => $clientToken,
        ], [
            'started_at' => ['required', 'integer', 'min:1'],
            'ended_at' => ['required', 'integer', 'gt:started_at'],
            'description' => ['nullable', 'string', 'max:1000'],
            'client_token' => ['required', 'uuid'],
        ])->after(function ($validator) use ($startedAt, $endedAt): void {
            $duration = $endedAt - $startedAt;

            if ($duration < 60 || $duration > 86400) {
                $validator->errors()->add('ended_at', 'La sesión debe durar entre 1 minuto y 24 horas.');
            }

            if ($endedAt > now()->addSeconds(5)->timestamp) {
                $validator->errors()->add('ended_at', 'La sesión todavía no ha terminado.');
            }
        })->validate();

        $start = Carbon::createFromTimestamp($validated['started_at'], config('app.timezone'));
        $duration = $validated['ended_at'] - $validated['started_at'];

        PomodoroSession::firstOrCreate([
            'client_token' => $validated['client_token'],
        ], [
            'date' => $start->toDateString(),
            'start_time' => ['timestamp' => $validated['started_at']],
            'end_time' => ['timestamp' => $validated['ended_at']],
            'duration' => $duration,
            'completed' => true,
            'description' => trim($validated['description']) ?: null,
        ]);

        $this->selectedDate = $start->toDateString();
    }

    public function saveManualSession(): void
    {
        $validated = $this->validate([
            'manualStart' => ['required', 'date_format:Y-m-d\TH:i'],
            'manualEnd' => ['required', 'date_format:Y-m-d\TH:i'],
            'manualDescription' => ['nullable', 'string', 'max:1000'],
        ]);

        $start = $this->parseManualDateTime($validated['manualStart']);
        $end = $this->parseManualDateTime($validated['manualEnd']);

        if ($end->lessThanOrEqualTo($start)) {
            $this->addError('manualEnd', 'La fecha y hora de fin debe ser posterior al inicio.');

            return;
        }

        if ($end->isFuture()) {
            $this->addError('manualEnd', 'No puedes registrar tiempo que todavía no ha transcurrido.');

            return;
        }

        $duration = $start->diffInSeconds($end);

        if ($duration > 57600) {
            $this->addError('manualEnd', 'El registro manual no puede superar 16 horas.');

            return;
        }

        PomodoroSession::create([
            'date' => $start->toDateString(),
            'start_time' => ['timestamp' => $start->timestamp],
            'end_time' => ['timestamp' => $end->timestamp],
            'duration' => $duration,
            'completed' => true,
            'description' => trim($validated['manualDescription']) ?: null,
        ]);

        $this->selectedDate = $start->toDateString();
        $this->manualStart = '';
        $this->manualEnd = '';
        $this->manualDescription = '';
    }

    public function deleteSession(string $id): void
    {
        PomodoroSession::findOrFail($id)->delete();
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
            'manualDurationSeconds' => $this->manualDurationSeconds(),
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

    private function manualDurationSeconds(): ?int
    {
        if ($this->manualStart === '' || $this->manualEnd === '') {
            return null;
        }

        try {
            $start = $this->parseManualDateTime($this->manualStart);
            $end = $this->parseManualDateTime($this->manualEnd);

            return $end->greaterThan($start) ? $start->diffInSeconds($end) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function parseManualDateTime(string $value): Carbon
    {
        return Carbon::createFromFormat('!Y-m-d\TH:i', $value, config('app.timezone'));
    }
}
