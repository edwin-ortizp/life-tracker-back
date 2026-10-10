<?php

use App\Models\ShoppingItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

// Only used by the isolated purchase browser suite, never the configured database.
require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$path = str_replace('\\', '/', (string) config('database.connections.sqlite.database'));
if (config('database.default') !== 'sqlite' || ! str_ends_with($path, '/storage/framework/testing/purchase-browser.sqlite')) {
    throw new RuntimeException('Browser fixture requires its dedicated SQLite database.');
}
Artisan::call('migrate:fresh', ['--force' => true]);
$user = User::factory()->create(['email' => 'purchase-browser@example.test', 'password' => 'browser-test-password']);
auth()->login($user);
Store::create(['name' => 'Tienda de prueba']);
foreach (['Pan de prueba', 'Leche de prueba'] as $name) {
    $item = ShoppingItem::create(['name' => $name, 'base_unit' => 'unit', 'stock' => 0, 'status' => 'available', 'next_purchase' => true]);
    $item->variants()->create(['content' => 5, 'packaging' => 'paquete']);
}
echo "Purchase browser fixture ready.\n";
