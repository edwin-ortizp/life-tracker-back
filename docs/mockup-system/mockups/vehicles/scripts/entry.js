import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountVehicleMap, mountMaintenanceHistory} from '@project/project-assets/vehicle-map.js';
startMockup({'vehicles-index': mountLifeShell, 'vehicles-show': mountLifeShell, 'vehicles-fuel': mountLifeShell, 'vehicles-maintenance': mountVehicleMap, 'vehicles-maintenance-history': mountMaintenanceHistory, 'vehicles-expenses': mountLifeShell});
