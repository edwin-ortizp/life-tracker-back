<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Opt-in, local-only timings. Never records SQL, bindings or user data. */
class MeasurePerformance
{
    public function handle(Request $request, Closure $next)
    {
        if (! app()->environment(['local', 'testing']) || ! config('app.measure_performance', false)) {
            return $next($request);
        }

        $started = hrtime(true);
        $sqlMs = 0;
        $queries = 0;
        $connection = DB::connection();
        $dispatcher = $connection->getEventDispatcher();
        $scoped = clone $dispatcher;
        $scoped->listen(QueryExecuted::class, function (QueryExecuted $query) use (&$sqlMs, &$queries): void {
            $sqlMs += $query->time;
            $queries++;
        });
        $connection->setEventDispatcher($scoped);
        try {
            $response = $next($request);
        } finally {
            $connection->setEventDispatcher($dispatcher);
        }
        $response->headers->set('Server-Timing', sprintf('app;dur=%.2f, sql;dur=%.2f, queries;desc="%d"', (hrtime(true) - $started) / 1e6, $sqlMs, $queries));

        return $response;
    }
}
