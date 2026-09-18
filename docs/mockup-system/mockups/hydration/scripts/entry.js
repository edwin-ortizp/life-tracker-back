import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountDrinkSettings} from './hydration-settings.js';
import {mountLogSort} from '@project/project-assets/log-sort.js';
startMockup({'water-daily': context => { mountLifeShell(context); mountLogSort(context, 'water-log'); }, 'water-weekly': mountLifeShell, 'water-settings': context => { mountLifeShell(context); mountDrinkSettings(context); }});
