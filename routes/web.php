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
    Route::redirect('/water', '/water/daily')->name('water');
    Route::get('/water/daily', \App\Livewire\Water\WaterDaily::class)->name('water.daily');
    Route::get('/water/calendar', \App\Livewire\Water\WaterCalendar::class)->name('water.calendar');
    Route::get('/water/weekly', \App\Livewire\Water\WaterWeekly::class)->name('water.weekly');
    Route::get('/water/range', \App\Livewire\Water\WaterRange::class)->name('water.range');
    Route::get('/water/settings', \App\Livewire\Water\WaterSettings::class)->name('water.settings');
    Route::get('/exercise', \App\Livewire\Exercise\ExerciseDaily::class)->name('exercise');
    Route::get('/health', \App\Livewire\Health\HealthIndex::class)->name('health');
    Route::get('/health/body', \App\Livewire\Health\HealthBodyMap::class)->name('health.body');
    Route::get('/vehicles', \App\Livewire\Vehicle\VehicleIndex::class)->name('vehicles');
    Route::get('/vehicles/maintenance-catalog', \App\Livewire\Vehicle\VehicleCatalog::class)->name('vehicles.catalog');
    Route::get('/vehicles/{vehicle}', \App\Livewire\Vehicle\VehicleShow::class)->name('vehicles.show');
    Route::get('/vehicles/{vehicle}/fuel', \App\Livewire\Vehicle\VehicleFuel::class)->name('vehicles.fuel');
    Route::get('/vehicles/{vehicle}/maintenance', \App\Livewire\Vehicle\VehicleMaintenance::class)->name('vehicles.maintenance');
    Route::get('/habits', \App\Livewire\Habit\HabitTracker::class)->name('habits');
    Route::get('/habits/weekly', \App\Livewire\Habit\HabitWeekly::class)->name('habits.weekly');
    Route::get('/mood', \App\Livewire\Mood\MoodTracker::class)->name('mood');
    Route::get('/journal', \App\Livewire\Journal\JournalEntries::class)->name('journal');
    Route::get('/journal/life', \App\Livewire\Journal\JournalLifeCalendar::class)->name('journal.life');
    Route::get('/journal/life/week', \App\Livewire\Journal\JournalLifeWeek::class)->name('journal.life.week');
    Route::get('/pomodoro', \App\Livewire\Pomodoro\PomodoroTimer::class)->name('pomodoro');
    Route::get('/pomodoro/settings', \App\Livewire\Pomodoro\PomodoroSettings::class)->name('pomodoro.settings');
    Route::redirect('/meals', '/meals/weekly')->name('meals');
    Route::get('/meals/weekly', \App\Livewire\Meal\MealWeekly::class)->name('meals.weekly');
    Route::get('/meals/recipes', \App\Livewire\Meal\MealRecipes::class)->name('meals.recipes');
    Route::get('/meals/ingredients', \App\Livewire\Meal\MealIngredients::class)->name('meals.ingredients');
    Route::get('/meals/shopping', \App\Livewire\Meal\MealShopping::class)->name('meals.shopping');
    Route::redirect('/tasks', '/tasks/list')->name('tasks');
    Route::get('/tasks/list', \App\Livewire\Task\TaskList::class)->name('tasks.list');
    Route::get('/tasks/gantt', \App\Livewire\Task\TaskGantt::class)->name('tasks.gantt');
    Route::get('/tasks/flow', \App\Livewire\Task\TaskFlow::class)->name('tasks.flow');
    Route::get('/tasks/kanban', \App\Livewire\Task\TaskKanban::class)->name('tasks.kanban');
    Route::get('/tasks/planning', \App\Livewire\Task\TaskPlanning::class)->name('tasks.planning');
    Route::get('/tasks/progress', \App\Livewire\Task\TaskProgress::class)->name('tasks.progress');
    Route::get('/relationships', \App\Livewire\Relationship\RelationshipIndex::class)->name('relationships');
    Route::get('/goals', \App\Livewire\Goal\GoalIndex::class)->name('goals');
    Route::get('/goals/{goal}', \App\Livewire\Goal\GoalDetail::class)->name('goals.show');
    Route::get('/statistics', \App\Livewire\Statistics\StatisticsDashboard::class)->name('statistics');
    Route::get('/negative-habits', \App\Livewire\NegativeHabit\NegativeHabitWeekly::class)->name('negative-habits');
    Route::get('/settings', \App\Livewire\Settings\SettingsPage::class)->name('settings');
});
