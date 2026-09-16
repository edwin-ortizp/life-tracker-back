<?php

namespace App\Providers;

use App\CalDav\AuthBackend;
use App\CalDav\PrincipalBackend;
use App\CalDav\TaskCalendarBackend;
use App\Models\DrinkLog;
use App\Models\EnergyEntry;
use App\Models\ExerciseLog;
use App\Models\Goal;
use App\Models\HealthEvent;
use App\Models\MoodEntry;
use App\Models\Relationship;
use App\Models\RelationshipEvent;
use App\Models\Task;
use App\Observers\TaskCalDavObserver;
use App\Support\Habits\HabitActionRegistry;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;
use LaravelSabre\LaravelSabre;
use Sabre\CalDAV\CalendarRoot;
use Sabre\CalDAV\Plugin;
use Sabre\DAV\Auth\Plugin as AuthPlugin;
use Sabre\DAV\Browser\Plugin as BrowserPlugin;
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
        $this->app->singleton(
            HabitActionRegistry::class,
            fn (): HabitActionRegistry => new HabitActionRegistry(config('habit_actions.actions', [])),
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Task::observe(TaskCalDavObserver::class);

        // Clientes OAuth de MCP: access tokens cortos y refresh rotativo de un mes.
        Passport::tokensExpireIn(now()->addHour());
        Passport::refreshTokensExpireIn(now()->addDays(30));
        Passport::personalAccessTokensExpireIn(now()->addDays(30));
        Passport::authorizationView('auth.oauth-authorize');

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
            new BrowserPlugin(enablePost: false),
        ]);

        Relation::enforceMorphMap([
            'goal' => Goal::class,
            'relationship' => Relationship::class,
            'health-event' => HealthEvent::class,
            'task' => Task::class,
            // Registros que puede crear un hábito al completarse, para poder deshacerlos.
            'drink-log' => DrinkLog::class,
            'exercise-log' => ExerciseLog::class,
            'mood-entry' => MoodEntry::class,
            'energy-entry' => EnergyEntry::class,
            'relationship-event' => RelationshipEvent::class,
        ]);
    }
}
