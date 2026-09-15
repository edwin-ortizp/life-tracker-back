import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountDrinkSettings} from './hydration-settings.js';
startMockup({'water-daily': mountLifeShell, 'water-weekly': mountLifeShell, 'water-settings': context => { mountLifeShell(context); mountDrinkSettings(context); }});
