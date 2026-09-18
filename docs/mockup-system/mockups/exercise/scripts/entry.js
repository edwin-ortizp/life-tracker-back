import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountLogSort} from '@project/project-assets/log-sort.js';
startMockup({'exercise-daily': context => { mountLifeShell(context); mountLogSort(context, 'exercise-log'); }, 'exercise-statistics': mountLifeShell, 'exercise-settings': mountLifeShell});
