<?php

namespace Tests\Feature;

use App\Livewire\Vehicle\VehicleIndex;
use App\Models\MaintenanceTemplate;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleEnergyLog;
use App\Models\VehicleMaintenancePlan;
use App\Support\VehicleMaintenanceStatus;
use App\Support\VehicleEnergyAnalytics;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class VehicleModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_vehicles_are_private_and_energy_logs_cannot_cross_tenant_boundaries(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $ownerVehicle = $owner->vehicles()->create(['name' => 'Moto propia', 'vehicle_type' => 'motocicleta', 'power_source' => 'gasolina', 'usage_unit' => 'km']);
        $otherVehicle = $other->vehicles()->create(['name' => 'Auto ajeno', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina']);

        $this->actingAs($owner);
        $this->assertSame([$ownerVehicle->id], Vehicle::pluck('id')->all());

        $this->expectException(QueryException::class);
        VehicleEnergyLog::create([
            'vehicle_id' => $otherVehicle->id,
            'recorded_on' => '2026-07-12',
            'energy_source' => 'gasolina',
            'quantity' => 10,
            'unit' => 'L',
        ]);
    }

    public function test_energy_and_maintenance_logs_update_vehicle_history_and_alert_status(): void
    {
        Carbon::setTestNow('2026-07-12 10:00:00');
        $user = User::factory()->create();
        $vehicle = $user->vehicles()->create([
            'name' => 'Patineta eléctrica', 'vehicle_type' => 'patineta', 'power_source' => 'electrico',
            'usage_unit' => 'km', 'current_usage' => 100,
        ]);
        $template = MaintenanceTemplate::create([
            'name' => 'Frenos de prueba', 'category' => 'seguridad', 'vehicle_types' => ['patineta'],
            'default_interval_days' => 30, 'default_interval_usage' => 100,
        ]);
        $this->actingAs($user);
        $plan = $user->vehicles()->find($vehicle->id)->maintenancePlans()->create([
            'maintenance_template_id' => $template->id, 'interval_days' => 30, 'interval_usage' => 100,
            'baseline_date' => '2026-06-12', 'baseline_usage' => 100,
        ]);

        $this->get('/vehicles')->assertOk()->assertSee('Patineta eléctrica');

        Livewire::test(VehicleIndex::class)
            ->set('selectedVehicleId', $vehicle->id)
            ->call('openEnergyForm')
            ->set('energyDate', '2026-07-12')
            ->set('energySource', 'electrico')
            ->set('energyQuantity', 1.8)
            ->set('energyUnit', 'kWh')
            ->set('energyUsageReading', 130)
            ->call('saveEnergyLog')
            ->assertSet('showEnergyForm', false);

        $this->assertDatabaseHas('vehicle_energy_logs', ['vehicle_id' => $vehicle->id, 'quantity' => 1.8, 'unit' => 'kWh']);
        $this->assertSame('130.00', $vehicle->fresh()->current_usage);
        $this->assertSame('vencido', VehicleMaintenanceStatus::forPlan($plan->fresh()->load('vehicle'))['status']);

        Livewire::test(VehicleIndex::class)
            ->set('selectedVehicleId', $vehicle->id)
            ->call('openMaintenanceForm', $plan->id)
            ->set('maintenanceDate', '2026-07-12')
            ->set('maintenanceUsageReading', 130)
            ->call('saveMaintenanceLog');

        $this->assertDatabaseHas('vehicle_maintenance_logs', ['vehicle_id' => $vehicle->id, 'vehicle_maintenance_plan_id' => $plan->id, 'usage_reading' => 130]);
        $this->assertSame('proximo', VehicleMaintenanceStatus::forPlan($plan->fresh()->load('vehicle', 'maintenanceLogs'))['status']);
        Carbon::setTestNow();
    }

    public function test_fuel_analytics_normalizes_liters_and_uses_partial_refills_between_full_tanks(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $vehicle = $user->vehicles()->create([
            'name' => 'Automóvil', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina',
            'fuel_volume_unit' => 'gal', 'usage_unit' => 'km', 'current_usage' => 130,
        ]);

        $vehicle->energyLogs()->create(['recorded_on' => '2026-07-01', 'energy_source' => 'gasolina', 'quantity' => 3.78541, 'unit' => 'L', 'is_full' => true, 'cost' => 15000, 'usage_reading' => 100]);
        $vehicle->energyLogs()->create(['recorded_on' => '2026-07-05', 'energy_source' => 'gasolina', 'quantity' => 1, 'unit' => 'gal', 'is_full' => false, 'cost' => 5000, 'usage_reading' => 115]);
        $vehicle->energyLogs()->create(['recorded_on' => '2026-07-10', 'energy_source' => 'gasolina', 'quantity' => 7.57082, 'unit' => 'L', 'is_full' => true, 'cost' => 12000, 'usage_reading' => 130]);

        $analytics = VehicleEnergyAnalytics::forVehicle($vehicle);

        $this->assertSame('gal', $analytics['unit']);
        $this->assertEqualsWithDelta(6000, $analytics['latest_price'], 1);
        $this->assertEqualsWithDelta(8000, $analytics['weighted_average_price'], 3);
        $this->assertEqualsWithDelta(10, $analytics['latest_efficiency']['efficiency'], 0.01);
        $this->assertEqualsWithDelta(-66.666, $analytics['price_history'][1]->price_change, 0.1);
        $this->assertDatabaseHas('vehicle_energy_logs', ['vehicle_id' => $vehicle->id, 'unit' => 'L', 'quantity' => 3.78541]);
    }

    public function test_personal_maintenance_templates_are_private_and_base_templates_are_read_only(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $baseTemplate = MaintenanceTemplate::create(['name' => 'Revisión base', 'category' => 'general']);

        $this->actingAs($owner);
        Livewire::test(VehicleIndex::class)
            ->call('openTemplateForm')
            ->set('templateName', 'Servicio especial')
            ->set('templateCategory', 'personalizado')
            ->set('templateVehicleTypes', ['automovil'])
            ->set('templateTransmissionTypes', ['automatica'])
            ->set('templateDefaultIntervalUsage', 12000)
            ->call('saveTemplate')
            ->assertSet('showTemplateForm', false);

        $personalTemplate = MaintenanceTemplate::where('name', 'Servicio especial')->firstOrFail();
        $this->assertSame($owner->id, $personalTemplate->user_id);

        Livewire::test(VehicleIndex::class)
            ->call('openTemplateForm', $baseTemplate->id)
            ->assertSet('editingTemplateId', null)
            ->call('deleteTemplate', $baseTemplate->id);
        $this->assertDatabaseHas('maintenance_templates', ['id' => $baseTemplate->id]);

        Livewire::test(VehicleIndex::class)
            ->call('openTemplateForm', $personalTemplate->id)
            ->set('templateCategory', 'motor')
            ->call('saveTemplate');
        $this->assertDatabaseHas('maintenance_templates', ['id' => $personalTemplate->id, 'category' => 'motor']);

        $this->actingAs($other);
        Livewire::test(VehicleIndex::class)
            ->call('deleteTemplate', $personalTemplate->id)
            ->assertSet('catalogMessage', 'Solo puedes eliminar tus propias plantillas.');
        $this->assertDatabaseHas('maintenance_templates', ['id' => $personalTemplate->id]);

        $this->actingAs($owner);
        Livewire::test(VehicleIndex::class)->call('deleteTemplate', $personalTemplate->id);
        $this->assertDatabaseMissing('maintenance_templates', ['id' => $personalTemplate->id]);
    }

    public function test_catalog_filters_templates_by_vehicle_transmission_and_keeps_plan_intervals_independent(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $vehicle = $user->vehicles()->create([
            'name' => 'Auto automático', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina',
            'transmission_type' => 'automatica', 'usage_unit' => 'km', 'current_usage' => 50000,
        ]);
        $automatic = MaintenanceTemplate::create([
            'name' => 'Fluido automático', 'category' => 'transmisión', 'vehicle_types' => ['automovil'],
            'transmission_types' => ['automatica'], 'default_interval_usage' => 60000,
        ]);
        MaintenanceTemplate::create([
            'name' => 'Aceite manual', 'category' => 'transmisión', 'vehicle_types' => ['automovil'],
            'transmission_types' => ['manual'], 'default_interval_usage' => 60000,
        ]);

        Livewire::test(VehicleIndex::class)
            ->set('selectedVehicleId', $vehicle->id)
            ->call('openPlanForm')
            ->assertViewHas('templates', fn ($templates) => $templates->pluck('id')->all() === [$automatic->id])
            ->set('templateId', $automatic->id)
            ->assertSet('planIntervalUsage', 60000)
            ->set('planIntervalUsage', 45000)
            ->call('savePlan');

        $plan = VehicleMaintenancePlan::firstOrFail();
        $automatic->update(['default_interval_usage' => 80000]);
        $this->assertSame('45000.00', $plan->fresh()->interval_usage);

        Livewire::test(VehicleIndex::class)
            ->call('deleteTemplate', $automatic->id)
            ->assertSet('catalogMessage', 'Solo puedes eliminar tus propias plantillas.');
        $this->assertDatabaseHas('maintenance_templates', ['id' => $automatic->id]);
    }

    public function test_personal_template_with_a_plan_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $vehicle = $user->vehicles()->create(['name' => 'Mi auto', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina']);
        $template = MaintenanceTemplate::create(['user_id' => $user->id, 'name' => 'Plan propio', 'category' => 'general']);
        $vehicle->maintenancePlans()->create(['maintenance_template_id' => $template->id, 'interval_days' => 365]);

        Livewire::test(VehicleIndex::class)
            ->call('deleteTemplate', $template->id)
            ->assertSet('catalogMessage', 'No se puede eliminar una plantilla con planes de mantenimiento asociados.');

        $this->assertDatabaseHas('maintenance_templates', ['id' => $template->id]);
        $this->assertDatabaseHas('vehicle_maintenance_plans', ['maintenance_template_id' => $template->id]);
    }

    public function test_catalog_management_filters_are_combinable_and_never_show_other_users_templates(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $base = MaintenanceTemplate::create(['name' => 'Inspección universal', 'category' => 'transmisión']);
        $automatic = MaintenanceTemplate::create([
            'user_id' => $owner->id, 'name' => 'Cambio de caja automática', 'category' => 'transmisión',
            'vehicle_types' => ['automovil'], 'power_sources' => ['gasolina'], 'transmission_types' => ['automatica'],
        ]);
        MaintenanceTemplate::create([
            'user_id' => $owner->id, 'name' => 'Cadena de moto', 'category' => 'transmisión',
            'vehicle_types' => ['motocicleta'],
        ]);
        MaintenanceTemplate::create(['user_id' => $other->id, 'name' => 'Caja privada ajena', 'category' => 'transmisión']);

        $this->actingAs($owner);
        Livewire::test(VehicleIndex::class)
            ->call('openCatalog')
            ->set('catalogSearch', 'caja')
            ->assertViewHas('catalogTemplates', fn ($templates) => $templates->pluck('id')->all() === [$automatic->id])
            ->call('clearCatalogFilters')
            ->set('catalogCategory', 'transmisión')
            ->set('catalogVehicleType', 'automovil')
            ->set('catalogPowerSource', 'gasolina')
            ->set('catalogTransmissionType', 'automatica')
            ->assertViewHas('catalogTemplates', fn ($templates) => $templates->pluck('id')->sort()->values()->all() === collect([$base->id, $automatic->id])->sort()->values()->all())
            ->set('catalogSource', 'personal')
            ->assertViewHas('catalogTemplates', fn ($templates) => $templates->pluck('id')->all() === [$automatic->id]);
    }
}
