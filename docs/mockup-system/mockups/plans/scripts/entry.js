import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountLogSort} from '@project/project-assets/log-sort.js';
startMockup({'plans-index': context => { mountLifeShell(context); mountLogSort(context, 'plans'); }, 'plans-show': mountLifeShell});
