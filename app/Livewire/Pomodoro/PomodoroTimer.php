<?php

namespace App\Livewire\Pomodoro;

use App\Models\PomodoroSession;
use Carbon\Carbon;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Pomodoro')]
class PomodoroTimer extends Component
{
    public int $workDuration = 25;
    public int $shortBreak = 5;
    public int $longBreak = 15;
    public string $description = '';

    public function saveSession(int $duration, string $description = '')
    {
        $now = now();

        PomodoroSession::create([
            'date' => $now->toDateString(),
            'start_time' => ['timestamp' => $now->subMinutes($duration)->timestamp],
            'end_time' => ['timestamp' => $now->timestamp],
            'duration' => $duration,
            'completed' => true,
            'description' => $description ?: null,
        ]);
    }

    public function deleteSession(string $id)
    {
        PomodoroSession::where('id', $id)->delete();
    }

    public function render()
    {
        $todaySessions = PomodoroSession::where('date', now()->toDateString())
            ->where('completed', true)
            ->orderByDesc('created_at')
            ->get();

        $totalMinutes = $todaySessions->sum('duration');
        $sessionCount = $todaySessions->count();

        return view('livewire.pomodoro.pomodoro-timer', [
            'todaySessions' => $todaySessions,
            'totalMinutes' => $totalMinutes,
            'sessionCount' => $sessionCount,
        ]);
    }
}
