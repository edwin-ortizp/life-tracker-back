import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountLogSort} from '@project/project-assets/log-sort.js';
startMockup({'relationships-index': context => { mountLifeShell(context); mountLogSort(context, 'people'); }, 'relationships-show': mountLifeShell, 'relationships-plans': mountLifeShell, 'relationships-history': mountLifeShell, 'relationships-events': mountLifeShell, 'relationships-birthdays': mountLifeShell});
