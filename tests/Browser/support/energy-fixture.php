<?php

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$path = str_replace('\\', '/', (string) config('database.connections.sqlite.database'));
if (config('database.default') !== 'sqlite' || ! str_ends_with($path, '/storage/framework/testing/energy-browser.sqlite')) {
    throw new RuntimeException('Dedicated energy browser SQLite required');
}
Artisan::call('migrate:fresh', ['--force' => true]);
$user = User::factory()->create(['email' => 'energy-browser@example.test', 'password' => 'browser-test-password']);
auth()->login($user);
$user->tasks()->create(['title' => 'Tarea de prueba de modal']);
$vehicle = $user->vehicles()->create(['name' => 'Auto de prueba', 'vehicle_type' => 'automovil', 'power_source' => 'hibrido', 'fuel_volume_unit' => 'gal', 'usage_unit' => 'km']);
echo json_encode(['fuel' => '/vehicles/'.$vehicle->id.'/fuel']);
