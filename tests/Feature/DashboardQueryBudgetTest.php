<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\MaintenanceTemplate;
use App\Models\Vehicle;
use App\Models\VehicleMaintenancePlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Presupuesto de consultas del inicio.
 *
 * Es la pantalla que mas se abre y la que mas se nota en movil. La proyeccion de
 * uso de los vehiculos se calculaba por plan, asi que anadir planes al mismo
 * vehiculo multiplicaba las consultas. Este test fija que ya no dependa del
 * numero de planes.
 */
class DashboardQueryBudgetTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_home_screen_does_not_query_more_as_a_vehicle_gains_plans(): void
    {
        $user = User::factory()->create();

        // `BelongsToUser` asigna el propietario desde la sesion.
        $this->actingAs($user);

        $vehicle = Vehicle::create([
            'name' => 'Coche',
            'vehicle_type' => 'car',
            'power_source' => 'gasoline',
            'usage_unit' => 'km',
            'current_usage' => 12000,
        ]);

        $addPlan = function (int $i) use ($vehicle) {
            $template = MaintenanceTemplate::create([
                'name' => "Plantilla {$i}",
                'category' => 'general',
            ]);

            VehicleMaintenancePlan::create([
                'vehicle_id' => $vehicle->id,
                'maintenance_template_id' => $template->id,
                'name' => "Plan {$i}",
                'active' => true,
                'interval_days' => 30,
                'baseline_date' => now()->subDays(90)->toDateString(),
                // Un intervalo por uso es lo que obliga a proyectar el consumo
                // del vehiculo, que es el calculo caro.
                'interval_usage' => 5000,
                'baseline_usage' => 10000,
            ]);
        };

        $measure = function (): int {
            $queries = 0;
            $listener = function () use (&$queries) { $queries++; };

            DB::listen($listener);
            $this->get('/')->assertOk();

            return $queries;
        };

        $addPlan(0);
        $conUnPlan = $measure();

        for ($i = 1; $i <= 5; $i++) {
            $addPlan($i);
        }

        $conSeisPlanes = $measure();

        // Los cinco planes extra comparten vehiculo: la proyeccion de uso se
        // resuelve una sola vez, asi que el coste no puede crecer con ellos.
        $this->assertLessThanOrEqual(
            $conUnPlan + 2,
            $conSeisPlanes,
            "El inicio paso de {$conUnPlan} a {$conSeisPlanes} consultas al anadir 5 planes al mismo vehiculo.",
        );
    }
}
