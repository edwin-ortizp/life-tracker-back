<?php

namespace App\Livewire\Pomodoro;

use App\Models\ModuleSetting;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Ajustes de Pomodoro')]
class PomodoroSettings extends Component
{
    public int $workDuration = 25;

    public int $shortBreak = 5;

    public int $longBreak = 15;

    public int $weekdayGoal = 300;

    public int $weekendGoal = 120;

    public string $message = '';

    public function mount(): void
    {
        $settings = ModuleSetting::where('module', 'pomodoro')->value('settings') ?? [];

        $this->workDuration = (int) ($settings['work_duration_minutes'] ?? 25);
        $this->shortBreak = (int) ($settings['short_break_minutes'] ?? 5);
        $this->longBreak = (int) ($settings['long_break_minutes'] ?? 15);
        $this->weekdayGoal = (int) ($settings['weekday_goal_minutes'] ?? 300);
        $this->weekendGoal = (int) ($settings['weekend_goal_minutes'] ?? 120);
    }

    public function save(): void
    {
        $validated = $this->validate([
            'workDuration' => ['required', 'integer', 'between:1,60'],
            'shortBreak' => ['required', 'integer', 'between:1,30'],
            'longBreak' => ['required', 'integer', 'between:1,60'],
            'weekdayGoal' => ['required', 'integer', 'between:0,1440'],
            'weekendGoal' => ['required', 'integer', 'between:0,1440'],
        ]);

        $setting = ModuleSetting::firstOrCreate(['module' => 'pomodoro']);
        $setting->update([
            'settings' => array_merge($setting->settings ?? [], [
                'work_duration_minutes' => $validated['workDuration'],
                'short_break_minutes' => $validated['shortBreak'],
                'long_break_minutes' => $validated['longBreak'],
                'weekday_goal_minutes' => $validated['weekdayGoal'],
                'weekend_goal_minutes' => $validated['weekendGoal'],
            ]),
        ]);

        $this->message = 'Ajustes de Pomodoro actualizados.';
    }

    public function render()
    {
        return view('livewire.pomodoro.pomodoro-settings');
    }
}
