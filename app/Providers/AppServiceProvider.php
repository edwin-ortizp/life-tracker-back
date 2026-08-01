<?php

namespace App\Providers;

use App\CalDav\AuthBackend;
use App\CalDav\PrincipalBackend;
use App\CalDav\TaskCalendarBackend;
use App\Models\Goal;
use App\Models\HealthEvent;
use App\Models\Relationship;
use App\Models\Task;
use App\Observers\TaskCalDavObserver;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;
use LaravelSabre\LaravelSabre;
use Sabre\CalDAV\CalendarRoot;
use Sabre\CalDAV\Plugin;
use Sabre\DAV\Auth\Plugin as AuthPlugin;
use Sabre\DAV\Sync\Plugin as SyncPlugin;
use Sabre\DAVACL\Plugin as AclPlugin;
use Sabre\DAVACL\PrincipalCollection;

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
        Task::observe(TaskCalDavObserver::class);

        LaravelSabre::nodes(function (): array {
            $principals = app(PrincipalBackend::class);

            return [
                new PrincipalCollection($principals),
                new CalendarRoot($principals, app(TaskCalendarBackend::class)),
            ];
        });
        LaravelSabre::plugins(fn (): array => [
            new AuthPlugin(app(AuthBackend::class)),
            new AclPlugin,
            new Plugin,
            new SyncPlugin,
        ]);

        Relation::enforceMorphMap([
            'goal' => Goal::class,
            'relationship' => Relationship::class,
            'health-event' => HealthEvent::class,
            'task' => Task::class,
        ]);
    }
}
