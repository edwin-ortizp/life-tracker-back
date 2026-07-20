<?php

namespace Tests\Feature;

use App\Livewire\Vehicle\VehicleCatalog;
use App\Livewire\Vehicle\VehicleFuel;
use App\Livewire\Vehicle\VehicleMaintenance;
use App\Livewire\Vehicle\VehicleShow;
use App\Models\MaintenanceTemplate;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleEnergyLog;
use App\Models\VehicleMaintenancePlan;
use App\Support\VehicleEnergyAnalytics;
use App\Support\VehicleMaintenanceStatus;
use App\Support\VehicleUsageProjection;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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

        Livewire::test(VehicleFuel::class, ['vehicle' => $vehicle->id])
            ->call('openEnergyForm')
            ->set('energyDate', '2026-07-12')
            ->set('energySource', 'electrico')
            ->set('energyQuantity', 1.8)
            ->set('energyCost', 3600)
            ->set('energyUnit', 'kWh')
            ->set('energyUsageReading', 130)
            ->call('saveEnergyLog')
            ->assertSet('showEnergyForm', false);

        $this->assertDatabaseHas('vehicle_energy_logs', ['vehicle_id' => $vehicle->id, 'quantity' => 1.8, 'unit' => 'kWh']);
        $this->assertSame('130.00', $vehicle->fresh()->current_usage);
        $this->assertSame('vencido', VehicleMaintenanceStatus::forPlan($plan->fresh()->load('vehicle'))['status']);

        Livewire::test(VehicleMaintenance::class, ['vehicle' => $vehicle->id])
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
        Livewire::test(VehicleCatalog::class)
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

        Livewire::test(VehicleCatalog::class)
            ->call('openTemplateForm', $baseTemplate->id)
            ->assertSet('editingTemplateId', null)
            ->call('deleteTemplate', $baseTemplate->id);
        $this->assertDatabaseHas('maintenance_templates', ['id' => $baseTemplate->id]);

        Livewire::test(VehicleCatalog::class)
            ->call('openTemplateForm', $personalTemplate->id)
            ->set('templateCategory', 'motor')
            ->call('saveTemplate');
        $this->assertDatabaseHas('maintenance_templates', ['id' => $personalTemplate->id, 'category' => 'motor']);

        $this->actingAs($other);
        Livewire::test(VehicleCatalog::class)
            ->call('deleteTemplate', $personalTemplate->id)
            ->assertSet('catalogMessage', 'Solo puedes eliminar tus propias plantillas.');
        $this->assertDatabaseHas('maintenance_templates', ['id' => $personalTemplate->id]);

        $this->actingAs($owner);
        Livewire::test(VehicleCatalog::class)->call('deleteTemplate', $personalTemplate->id);
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

        Livewire::test(VehicleMaintenance::class, ['vehicle' => $vehicle->id])
            ->call('openPlanForm')
            ->assertViewHas('templates', fn ($templates) => $templates->pluck('id')->all() === [$automatic->id])
            ->set('templateId', $automatic->id)
            ->assertSet('planIntervalUsage', 60000)
            ->set('planIntervalUsage', 45000)
            ->call('savePlan');

        $plan = VehicleMaintenancePlan::firstOrFail();
        $automatic->update(['default_interval_usage' => 80000]);
        $this->assertSame('45000.00', $plan->fresh()->interval_usage);

        Livewire::test(VehicleCatalog::class)
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

        Livewire::test(VehicleCatalog::class)
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
        Livewire::test(VehicleCatalog::class)
            ->set('catalogSearch', 'caja')
            ->assertViewHas('catalogTemplates', fn ($templates) => $templates->getCollection()->pluck('id')->all() === [$automatic->id])
            ->call('clearCatalogFilters')
            ->set('catalogCategory', 'transmisión')
            ->set('catalogVehicleType', 'automovil')
            ->set('catalogPowerSource', 'gasolina')
            ->set('catalogTransmissionType', 'automatica')
            ->assertViewHas('catalogTemplates', fn ($templates) => $templates->getCollection()->pluck('id')->sort()->values()->all() === collect([$base->id, $automatic->id])->sort()->values()->all())
            ->set('catalogSource', 'personal')
            ->assertViewHas('catalogTemplates', fn ($templates) => $templates->getCollection()->pluck('id')->all() === [$automatic->id]);
    }

    public function test_energy_pricing_calculates_any_missing_value(): void
    {
        $user = User::factory()->create();
        $vehicle = $user->vehicles()->create([
            'name' => 'Auto', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina',
            'fuel_volume_unit' => 'gal', 'usage_unit' => 'km',
        ]);
        $this->actingAs($user);

        Livewire::test(VehicleFuel::class, ['vehicle' => $vehicle->id])
            ->call('openEnergyForm')
            ->set('energyQuantity', 10)
            ->set('energyCost', 50000)
            ->assertSet('energyUnitPrice', 5000.0)
            ->assertSet('energyCalculatedField', 'unit_price')
            ->set('energyUnitPrice', 6000)
            ->assertSet('energyQuantity', 8.33)
            ->assertSet('energyCalculatedField', 'quantity')
            ->set('energyQuantity', 10)
            ->assertSet('energyCost', 60000.0)
            ->assertSet('energyCalculatedField', 'cost');
    }

    public function test_energy_pricing_recovers_when_livewire_sends_partial_input_order(): void
    {
        $user = User::factory()->create();
        $vehicle = $user->vehicles()->create([
            'name' => 'Auto', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina',
            'fuel_volume_unit' => 'gal', 'usage_unit' => 'km',
        ]);
        $this->actingAs($user);

        Livewire::test(VehicleFuel::class, ['vehicle' => $vehicle->id])
            ->call('openEnergyForm')
            ->set('energyQuantity', 10)
            ->set('energyCost', 50000)
            ->assertSet('energyUnitPrice', 5000.0)
            ->set('energyInputOrder', [])
            ->set('energyCost', null)
            ->assertSet('energyCost', 50000.0)
            ->assertSet('energyCalculatedField', 'cost');
    }

    public function test_energy_log_can_be_edited_in_its_original_unit_and_recalculates_current_usage(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $vehicle = $user->vehicles()->create([
            'name' => 'Auto', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina', 'fuel_volume_unit' => 'gal',
            'usage_unit' => 'km', 'current_usage' => 100, 'manual_usage_reading' => 100, 'manual_usage_recorded_at' => '2026-07-01 08:00:00',
        ]);
        $log = $vehicle->energyLogs()->create([
            'recorded_on' => '2026-07-10', 'energy_source' => 'gasolina', 'quantity' => 10,
            'unit' => 'L', 'is_full' => true, 'cost' => 50000, 'usage_reading' => 150,
        ]);
        $vehicle->update(['current_usage' => 150]);

        Livewire::test(VehicleFuel::class, ['vehicle' => $vehicle->id])
            ->call('openEnergyForm', $log->id)
            ->assertSet('energyUnit', 'L')
            ->set('energyCost', 60000)
            ->set('energyUsageReading', 140)
            ->call('saveEnergyLog')
            ->assertSet('showEnergyForm', false);

        $this->assertDatabaseHas('vehicle_energy_logs', ['id' => $log->id, 'unit' => 'L', 'quantity' => 10, 'cost' => 60000, 'usage_reading' => 140]);
        $this->assertSame('140.00', $vehicle->fresh()->current_usage);

        Livewire::test(VehicleFuel::class, ['vehicle' => $vehicle->id])->call('deleteEnergyLog', $log->id);
        $this->assertSame('100.00', $vehicle->fresh()->current_usage);
    }

    public function test_usage_readings_are_validated_across_energy_and_maintenance_in_creation_order(): void
    {
        Carbon::setTestNow('2026-07-12 12:00:00');
        $user = User::factory()->create();
        $this->actingAs($user);
        $vehicle = $user->vehicles()->create(['name' => 'Auto', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina', 'fuel_volume_unit' => 'gal', 'usage_unit' => 'km']);
        $template = MaintenanceTemplate::create(['name' => 'Servicio', 'category' => 'general']);
        $plan = $vehicle->maintenancePlans()->create(['maintenance_template_id' => $template->id, 'interval_usage' => 1000]);
        $vehicle->energyLogs()->create(['recorded_on' => '2026-07-10', 'energy_source' => 'gasolina', 'quantity' => 5, 'unit' => 'gal', 'cost' => 25000, 'usage_reading' => 100]);
        $vehicle->maintenanceLogs()->create(['vehicle_maintenance_plan_id' => $plan->id, 'performed_on' => '2026-07-11', 'usage_reading' => 150]);

        Livewire::test(VehicleFuel::class, ['vehicle' => $vehicle->id])
            ->call('openEnergyForm')
            ->set('energyDate', '2026-07-12')
            ->set('energyQuantity', 5)
            ->set('energyCost', 25000)
            ->set('energyUsageReading', 140)
            ->call('saveEnergyLog')
            ->assertHasErrors(['energyUsageReading']);

        $vehicle->energyLogs()->create(['recorded_on' => '2026-07-12', 'energy_source' => 'gasolina', 'quantity' => 5, 'unit' => 'gal', 'cost' => 25000, 'usage_reading' => 160]);
        Livewire::test(VehicleMaintenance::class, ['vehicle' => $vehicle->id])
            ->call('openMaintenanceForm', $plan->id)
            ->set('maintenanceDate', '2026-07-12')
            ->set('maintenanceUsageReading', 159)
            ->call('saveMaintenanceLog')
            ->assertHasErrors(['maintenanceUsageReading']);
        Carbon::setTestNow();
    }

    public function test_usage_projection_prefers_recent_window_and_falls_back_to_history(): void
    {
        Carbon::setTestNow('2026-07-19 10:00:00');
        $user = User::factory()->create();
        $this->actingAs($user);
        $vehicle = $user->vehicles()->create(['name' => 'Auto', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina', 'usage_unit' => 'km']);
        $vehicle->energyLogs()->create(['recorded_on' => '2026-04-01', 'energy_source' => 'gasolina', 'quantity' => 1, 'unit' => 'gal', 'cost' => 1, 'usage_reading' => 100]);
        $vehicle->energyLogs()->create(['recorded_on' => '2026-05-01', 'energy_source' => 'gasolina', 'quantity' => 1, 'unit' => 'gal', 'cost' => 1, 'usage_reading' => 400]);
        $vehicle->energyLogs()->create(['recorded_on' => '2026-07-01', 'energy_source' => 'gasolina', 'quantity' => 1, 'unit' => 'gal', 'cost' => 1, 'usage_reading' => 500]);
        $vehicle->energyLogs()->create(['recorded_on' => '2026-07-11', 'energy_source' => 'gasolina', 'quantity' => 1, 'unit' => 'gal', 'cost' => 1, 'usage_reading' => 700]);
        $vehicle->energyLogs()->create(['recorded_on' => '2026-08-01', 'energy_source' => 'gasolina', 'quantity' => 1, 'unit' => 'gal', 'cost' => 1, 'usage_reading' => 2000]);

        $rate = VehicleUsageProjection::rateForVehicle($vehicle);
        $this->assertSame('90_dias', $rate['basis']);
        $this->assertEqualsWithDelta(300 / 71, $rate['daily_rate'], 0.01);
        $this->assertSame('2026-09-20', VehicleUsageProjection::forDueUsage($vehicle, 1000)['projected_date']->toDateString());

        $vehicle->energyLogs()->where('recorded_on', '>=', '2026-07-01')->delete();
        $fallback = VehicleUsageProjection::rateForVehicle($vehicle);
        $this->assertSame('historial', $fallback['basis']);
        $this->assertEqualsWithDelta(10, $fallback['daily_rate'], 0.01);
        Carbon::setTestNow();
    }

    public function test_vehicle_uses_contextual_energy_labels_and_keeps_unit_setting_in_edit_form(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $fuel = $user->vehicles()->create(['name' => 'Auto', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina', 'fuel_volume_unit' => 'gal']);
        $electric = $user->vehicles()->create(['name' => 'EV', 'vehicle_type' => 'automovil', 'power_source' => 'electrico']);
        $hybrid = $user->vehicles()->create(['name' => 'Híbrido', 'vehicle_type' => 'automovil', 'power_source' => 'hibrido', 'fuel_volume_unit' => 'gal']);
        $oldLog = $fuel->energyLogs()->create(['recorded_on' => '2026-07-01', 'energy_source' => 'gasolina', 'quantity' => 5, 'unit' => 'gal', 'cost' => 25000]);

        Livewire::test(VehicleShow::class, ['vehicle' => $fuel->id])
            ->assertSee('Combustible')
            ->call('editVehicle')
            ->assertSee('Unidad de combustible')
            ->set('fuelVolumeUnit', 'L')
            ->call('saveVehicle');
        $this->assertSame('L', $fuel->fresh()->fuel_volume_unit);
        $this->assertSame('gal', $oldLog->fresh()->unit);
        Livewire::test(VehicleFuel::class, ['vehicle' => $fuel->id])->call('openEnergyForm')->assertSet('energyUnit', 'L');
        Livewire::test(VehicleShow::class, ['vehicle' => $electric->id])->assertSee('Carga');
        Livewire::test(VehicleShow::class, ['vehicle' => $hybrid->id])->assertSee('Energía');
    }

    public function test_vehicle_pages_have_real_routes_and_enforce_ownership(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $vehicle = $owner->vehicles()->create(['name' => 'Auto privado', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina']);
        $human = $owner->vehicles()->create(['name' => 'Bicicleta', 'vehicle_type' => 'bicicleta', 'power_source' => 'humana']);

        $this->actingAs($owner)
            ->get(route('vehicles.show', $vehicle))->assertOk()->assertSee('Auto privado')
            ->assertSee(route('vehicles.fuel', $vehicle), false)
            ->assertSee(route('vehicles.maintenance', $vehicle), false);
        $this->get(route('vehicles.fuel', $vehicle))->assertOk();
        $this->get(route('vehicles.maintenance', $vehicle))->assertOk();
        $this->get(route('vehicles.catalog'))->assertOk();
        $this->get(route('vehicles.fuel', $human))->assertNotFound();

        $this->actingAs($other)->get(route('vehicles.show', $vehicle))->assertNotFound();
        $this->get(route('vehicles.fuel', $vehicle))->assertNotFound();
        $this->get(route('vehicles.maintenance', $vehicle))->assertNotFound();
    }

    public function test_histories_and_catalog_are_paginated_twenty_at_a_time(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $vehicle = $user->vehicles()->create(['name' => 'Auto', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina']);
        $template = MaintenanceTemplate::create(['name' => 'Servicio paginado', 'category' => 'general']);
        $plan = $vehicle->maintenancePlans()->create(['maintenance_template_id' => $template->id, 'interval_days' => 30]);

        foreach (range(1, 25) as $day) {
            $vehicle->energyLogs()->create(['recorded_on' => sprintf('2026-06-%02d', $day), 'energy_source' => 'gasolina', 'quantity' => 1, 'unit' => 'gal', 'cost' => 5000, 'usage_reading' => $day * 10]);
            $vehicle->maintenanceLogs()->create(['vehicle_maintenance_plan_id' => $plan->id, 'performed_on' => sprintf('2026-06-%02d', $day), 'usage_reading' => $day * 10]);
            MaintenanceTemplate::create(['user_id' => $user->id, 'name' => "Plantilla $day", 'category' => 'personalizado']);
        }

        Livewire::test(VehicleFuel::class, ['vehicle' => $vehicle->id])
            ->assertViewHas('energyLogs', fn ($logs) => $logs->count() === 20 && $logs->total() === 25);
        Livewire::test(VehicleMaintenance::class, ['vehicle' => $vehicle->id])
            ->assertViewHas('maintenanceLogs', fn ($logs) => $logs->count() === 20 && $logs->total() === 25);
        Livewire::test(VehicleCatalog::class)
            ->set('catalogSource', 'personal')
            ->assertViewHas('catalogTemplates', fn ($templates) => $templates->count() === 20 && $templates->total() === 25);
    }

    public function test_each_vehicle_page_avoids_queries_from_unrelated_tabs(): void
    {
        $user = User::factory()->create();
        $vehicle = $user->vehicles()->create(['name' => 'Auto ligero', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina']);
        $queries = [];
        DB::listen(function ($query) use (&$queries): void {
            $queries[] = strtolower($query->sql);
        });

        $this->actingAs($user)->get(route('vehicles'))->assertOk();
        $this->assertFalse(collect($queries)->contains(fn (string $sql) => str_contains($sql, 'vehicle_energy_logs') || str_contains($sql, 'vehicle_maintenance_logs') || str_contains($sql, 'maintenance_templates')));

        $queries = [];
        $this->get(route('vehicles.fuel', $vehicle))->assertOk();
        $this->assertFalse(collect($queries)->contains(fn (string $sql) => str_contains($sql, 'vehicle_maintenance_logs') || str_contains($sql, 'maintenance_templates')));
    }
}
