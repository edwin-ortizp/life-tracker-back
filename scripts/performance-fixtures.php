<?php

// Run only against the explicitly selected disposable benchmark database.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (! app()->environment('testing') || config('database.default') !== 'sqlite'
    || ! str_ends_with(config('database.connections.sqlite.database'), 'performance.sqlite')) {
    throw new RuntimeException('Requires APP_ENV=testing and the disposable performance.sqlite database.');
}
Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true]);
foreach (['small' => 6, 'large' => 120] as $label => $count) {
    $user = App\Models\User::factory()->create(['name' => 'Performance '.$label, 'email' => $label.'@performance.test']);
    auth()->login($user);
    for ($i = 0; $i < $count; $i++) {
        $event = App\Models\HealthEvent::create(['title' => 'Synthetic event '.$i, 'type' => 'symptom', 'event_date' => today()->subDays($i + 10), 'details' => ['body_area' => 'head']]);
        for ($day = 0; $day < 4; $day++) {
            $event->logs()->create(['date' => $event->event_date->addDays($day), 'intensity' => 3]);
        }
        App\Models\Task::create(['title' => 'Synthetic task '.$i, 'category' => 'salud', 'task_code' => 10000 + $i, 'start_date' => today()]);
    }
}
echo "Synthetic small/large datasets ready.\n";
