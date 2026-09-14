import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
startMockup({'relationships-index': mountLifeShell, 'relationships-show': mountLifeShell, 'relationships-plans': mountLifeShell, 'relationships-history': mountLifeShell, 'relationships-events': mountLifeShell, 'relationships-birthdays': mountLifeShell});
