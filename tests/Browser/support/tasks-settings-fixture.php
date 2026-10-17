<?php

use App\Models\Task;
use App\Models\TaskCategory;
use App\Models\TaskStatus;
use App\Models\User;
use App\Support\DefaultTaskCategories;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$path = str_replace('\\', '/', (string) config('database.connections.sqlite.database'));
if (config('database.default') !== 'sqlite' || ! str_ends_with($path, '/storage/framework/testing/tasks-settings-browser.sqlite')) {
    throw new RuntimeException('Dedicated tasks settings browser SQLite required');
}
Artisan::call('migrate:fresh', ['--force' => true]);
$user = User::factory()->create(['email' => 'tasks-settings-browser@example.test', 'password' => 'browser-test-password']);
auth()->login($user);

// Catálogo base más una hija para ejercitar la ruta visible ("Tecnología / Automatización").
DefaultTaskCategories::createFor($user);
$tech = TaskCategory::where('key', 'tecnologia')->firstOrFail();
$user->taskCategories()->create([
    'parent_id' => $tech->id,
    'key' => 'automatizacion',
    'name' => 'Automatización',
    'icon' => 'bi-cpu',
    'sort_order' => 99,
]);

// Estados predeterminados más uno extra dentro de "en curso" para probar Subir/Bajar dentro del tipo.
$statuses = TaskStatus::ensureFor($user->id);
$user->taskStatuses()->create(['name' => 'Bloqueado', 'type' => TaskStatus::IN_PROGRESS, 'sort_order' => 99]);

$todo = $statuses->firstWhere('type', TaskStatus::TODO);
$wip = $statuses->firstWhere('type', TaskStatus::IN_PROGRESS);
$done = $statuses->firstWhere('type', TaskStatus::DONE);

// "Hogar" queda con tareas para abrir el diálogo de reasignación al eliminar.
Task::create(['title' => 'Barrer la casa', 'category' => 'hogar', 'status_id' => $todo->id]);
Task::create(['title' => 'Comprar mercado', 'category' => 'hogar', 'status_id' => $todo->id]);
// "en curso" con una tarea para el diálogo de reasignación de estados.
Task::create(['title' => 'Revisar tablero', 'category' => 'automatizacion', 'status_id' => $wip->id]);
Task::create(['title' => 'Pagar servicios', 'category' => 'finanzas', 'status_id' => $done->id]);
