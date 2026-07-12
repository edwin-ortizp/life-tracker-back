<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

// Auth routes (guests only)
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
    Route::get('/register', [RegisterController::class, 'show'])->name('register');
    Route::post('/register', [RegisterController::class, 'register']);
});

Route::post('/logout', [LoginController::class, 'logout'])->middleware('auth')->name('logout');

// Protected routes
Route::middleware('auth')->group(function () {
    Route::get('/', \App\Livewire\Home\Dashboard::class)->name('home');
    Route::get('/water', \App\Livewire\Water\WaterDaily::class)->name('water');
    Route::get('/exercise', \App\Livewire\Exercise\ExerciseDaily::class)->name('exercise');
    Route::get('/habits', \App\Livewire\Habit\HabitTracker::class)->name('habits');
    Route::get('/mood', \App\Livewire\Mood\MoodTracker::class)->name('mood');
    Route::get('/journal', \App\Livewire\Journal\JournalEntries::class)->name('journal');
    Route::get('/pomodoro', \App\Livewire\Pomodoro\PomodoroTimer::class)->name('pomodoro');
    Route::get('/meals', \App\Livewire\Meal\MealWeekly::class)->name('meals');
    Route::get('/tasks', \App\Livewire\Task\TaskList::class)->name('tasks');
    Route::get('/tasks/kanban', \App\Livewire\Task\TaskKanban::class)->name('tasks.kanban');
    Route::get('/relationships', \App\Livewire\Relationship\RelationshipIndex::class)->name('relationships');
    Route::get('/goals', \App\Livewire\Goal\GoalIndex::class)->name('goals');
    Route::get('/statistics', \App\Livewire\Statistics\StatisticsDashboard::class)->name('statistics');
    Route::get('/negative-habits', \App\Livewire\NegativeHabit\NegativeHabitWeekly::class)->name('negative-habits');
    Route::get('/settings', \App\Livewire\Settings\SettingsPage::class)->name('settings');
});
