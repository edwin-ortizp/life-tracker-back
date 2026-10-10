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
if (($argv[1] ?? '') === '--update-stock') {
    $user = User::where('email', 'purchase-browser@example.test')->firstOrFail();
    $stock = (int) ($argv[2] ?? 123);
    if (! in_array($stock, [123, 456], true)) {
        throw new RuntimeException('Unexpected fixture stock.');
    }
    ShoppingItem::where('user_id', $user->id)->where('name', 'Pan de prueba')->update(['stock' => $stock]);
    exit(0);
}
if (in_array($argv[1] ?? '', ['--setup-race', '--consume-race', '--race-state'], true)) {
    $user = User::where('email', 'purchase-browser@example.test')->firstOrFail();
    auth()->login($user);
    $inventory = app(\App\Services\Meal\MealInventory::class);
    if ($argv[1] === '--setup-race') {
        $product = ShoppingItem::create(['name' => 'Producto concurrencia', 'base_unit' => 'unit', 'stock' => 100, 'status' => 'available']);
        $ids = [];
        foreach (['1900-01-01', '1900-01-02'] as $date) {
            $ids[] = $inventory->plan($user->id, ['date' => $date, 'meal_type' => 'cena', 'items' => [['name' => 'Consumo concurrente', 'ingredients' => [['shopping_item_id' => $product->id, 'quantity' => 75]]]]])['meal_id'];
        }
        echo json_encode(['ids' => $ids]);
    } elseif ($argv[1] === '--consume-race') {
        try {
            $inventory->consume($user->id, (int) ($argv[2] ?? 0));
            echo json_encode(['consumed' => true]);
        } catch (\Illuminate\Validation\ValidationException $exception) {
            echo json_encode(['consumed' => false, 'error' => implode(' ', $exception->validator->errors()->all())]);
        }
    } else {
        echo json_encode(['stock' => ShoppingItem::where('name', 'Producto concurrencia')->sole()->stock,
            'consumed' => \App\Models\MealPlanEntry::where('user_id', $user->id)->where('status', 'consumed')->whereDate('date', '<', '1901-01-01')->count()]);
    }
    exit(0);
}
Artisan::call('migrate:fresh', ['--force' => true]);
$user = User::factory()->create(['email' => 'purchase-browser@example.test', 'password' => 'browser-test-password']);
auth()->login($user);
$milk = ShoppingItem::create(['name' => 'Leche de consumo', 'base_unit' => 'ml', 'stock' => 1000, 'status' => 'available', 'consume_by' => today()->addDays(2)]);
$milk->variants()->create(['content' => 1000, 'is_preferred' => true]);
$cake = ShoppingItem::create(['name' => 'Torta de consumo', 'base_unit' => 'g', 'stock' => 500, 'status' => 'available']);
$recipe = \App\Models\Recipe::create(['name' => 'Sopa de inventario', 'meal_type' => 'cena', 'servings' => 6, 'nutrition' => ['calories' => 100]]);
$recipe->recipeIngredients()->create(['shopping_item_id' => $milk->id, 'quantity' => 600, 'unit' => 'ml']);
$dinner = \App\Models\MealPlanEntry::create(['date' => now()->toDateString(), 'meal_type' => 'cena', 'notes' => 'Cena de prueba', 'calories' => 420]);
$dinner->items()->create(['name' => 'Sopa de prueba', 'calories' => 420, 'position' => 0]);
Store::create(['name' => 'Tienda de prueba']);
foreach (['Pan de prueba', 'Leche de prueba'] as $name) {
    $item = ShoppingItem::create(['name' => $name, 'base_unit' => 'unit', 'stock' => 0, 'status' => 'available', 'next_purchase' => true]);
    $item->variants()->create(['content' => 5, 'packaging' => 'paquete']);
}
echo "Purchase browser fixture ready.\n";
