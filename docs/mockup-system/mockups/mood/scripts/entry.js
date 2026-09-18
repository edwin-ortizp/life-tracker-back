import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountLogSort} from '@project/project-assets/log-sort.js';
startMockup({'mood-daily': context => { mountLifeShell(context); mountLogSort(context, 'mood-day-entries'); mountLogSort(context, 'energy-day-entries'); }, 'mood-trend': mountLifeShell});
