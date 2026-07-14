<?php

namespace App\Providers;

use App\Models\Goal;
use App\Models\HealthEvent;
use App\Models\Relationship;
use App\Models\Task;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Relation::enforceMorphMap([
            'goal' => Goal::class,
            'relationship' => Relationship::class,
            'health-event' => HealthEvent::class,
            'task' => Task::class,
        ]);
    }
}
