import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountLogSort} from '@project/project-assets/log-sort.js';
import {mountVehicleMap, mountMaintenanceHistory} from '@project/project-assets/vehicle-map.js';
startMockup({'vehicles-index': mountLifeShell, 'vehicles-show': mountLifeShell, 'vehicles-fuel': context => { mountLifeShell(context); mountLogSort(context, 'fuel'); }, 'vehicles-maintenance': mountVehicleMap, 'vehicles-maintenance-history': context => { mountMaintenanceHistory(context); mountLogSort(context, 'vehicle-maint-history'); }, 'vehicles-expenses': context => { mountLifeShell(context); mountLogSort(context, 'expense-history'); }});
