<?php

namespace Tests\Feature;

use App\Http\Middleware\MeasurePerformance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PerformanceMeasurementTest extends TestCase
{
    public function test_timings_require_local_opt_in_and_never_run_in_production(): void
    {
        foreach ([['testing', false, false], ['production', true, false], ['testing', true, true]] as [$environment, $enabled, $expected]) {
            $this->app['env'] = $environment;
            config(['app.measure_performance' => $enabled]);
            $response = (new MeasurePerformance)->handle(Request::create('/'), function () {
                DB::select('select 1');
                return response('ok');
            });
            $this->assertSame($expected, $response->headers->has('Server-Timing'));
            if ($expected) {
                $this->assertMatchesRegularExpression('/^app;dur=[\d.]+, sql;dur=[\d.]+, queries;desc="1"$/', $response->headers->get('Server-Timing'));
            }
        }
    }

    public function test_query_dispatcher_is_restored_even_when_the_request_throws(): void
    {
        config(['app.measure_performance' => true]);
        $dispatcher = DB::connection()->getEventDispatcher();
        try {
            (new MeasurePerformance)->handle(Request::create('/'), fn () => throw new \RuntimeException('Synthetic failure'));
            $this->fail('Expected synthetic failure');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Synthetic failure', $exception->getMessage());
        }
        $this->assertSame($dispatcher, DB::connection()->getEventDispatcher());
    }
}
