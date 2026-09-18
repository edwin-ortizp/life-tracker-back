import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountLogSort} from '@project/project-assets/log-sort.js';
startMockup({'goals-index': context => { mountLifeShell(context); mountLogSort(context, 'goals'); }, 'goals-detail': mountLifeShell});
