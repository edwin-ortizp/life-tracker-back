<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Vehicle\ListVehiclesTool;
use App\Mcp\Tools\Vehicle\LogVehicleFillupTool;
use App\Models\User;
use App\Models\VehicleEnergyLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LifeTrackerVehicleMcpTest extends TestCase
{
    use RefreshDatabase;

    private function makeVehicle(User $user, string $name = 'Cruz')
    {
        return $user->vehicles()->create([
            'name' => $name,
            'vehicle_type' => 'car',
            'power_source' => 'gasolina',
            'usage_unit' => 'km',
            'fuel_volume_unit' => 'gal',
        ]);
    }

    public function test_log_vehicle_fillup_tool_creates_a_log_and_reports_computed_efficiency(): void
    {
        $user = User::factory()->create();
        $vehicle = $this->makeVehicle($user);
        $this->actingAs($user);
        $vehicle->energyLogs()->create([
            'recorded_on' => today()->subDays(5),
            'energy_source' => 'gasolina',
            'quantity' => 10,
            'unit' => 'gal',
            'is_full' => true,
            'cost' => 100,
            'usage_reading' => 1000,
        ]);

        LifeTrackerServer::actingAs($user)
            ->tool(LogVehicleFillupTool::class, [
                'vehicle_id' => $vehicle->id,
                'quantity' => 10,
                'unit_price' => 10,
                'is_full' => true,
                'odometer' => 1400,
            ])
            ->assertOk()
            ->assertSee('Rendimiento más reciente');

        $this->assertDatabaseHas('vehicle_energy_logs', [
            'vehicle_id' => $vehicle->id,
            'quantity' => 10,
            'cost' => 100,
            'usage_reading' => 1400,
        ]);
    }

    public function test_log_vehicle_fillup_tool_solves_the_third_pricing_value(): void
    {
        $user = User::factory()->create();
        $vehicle = $this->makeVehicle($user);

        LifeTrackerServer::actingAs($user)
            ->tool(LogVehicleFillupTool::class, [
                'vehicle_id' => $vehicle->id,
                'cost' => 150,
                'unit_price' => 15,
            ])
            ->assertOk();

        $log = VehicleEnergyLog::where('vehicle_id', $vehicle->id)->firstOrFail();
        $this->assertSame('10.00', $log->quantity);
    }

    public function test_log_vehicle_fillup_tool_resolves_vehicle_by_stripped_nickname(): void
    {
        $user = User::factory()->create();
        $vehicle = $this->makeVehicle($user, 'Cruz');

        LifeTrackerServer::actingAs($user)
            ->tool(LogVehicleFillupTool::class, [
                'vehicle_name' => 'el Cruz',
                'quantity' => 5,
                'unit_price' => 10,
            ])
            ->assertOk();

        $this->assertDatabaseHas('vehicle_energy_logs', ['vehicle_id' => $vehicle->id]);
    }

    public function test_log_vehicle_fillup_tool_rejects_an_odometer_reading_lower_than_a_later_known_reading(): void
    {
        $user = User::factory()->create();
        $vehicle = $this->makeVehicle($user);
        $this->actingAs($user);
        $vehicle->energyLogs()->create([
            'recorded_on' => today()->addDays(2),
            'energy_source' => 'gasolina',
            'quantity' => 5,
            'unit' => 'gal',
            'usage_reading' => 500,
        ]);

        LifeTrackerServer::actingAs($user)
            ->tool(LogVehicleFillupTool::class, [
                'vehicle_id' => $vehicle->id,
                'date' => today()->toDateString(),
                'quantity' => 5,
                'unit_price' => 10,
                'odometer' => 600,
            ])
            ->assertHasErrors();

        $this->assertSame(1, VehicleEnergyLog::where('vehicle_id', $vehicle->id)->count());
    }

    public function test_list_vehicles_tool_only_returns_the_authenticated_users_vehicles(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $this->makeVehicle($owner, 'Mi carro');
        $this->makeVehicle($otherUser, 'Carro ajeno');

        LifeTrackerServer::actingAs($owner)
            ->tool(ListVehiclesTool::class, [])
            ->assertOk()
            ->assertSee('Mi carro')
            ->assertDontSee('Carro ajeno');
    }
}
