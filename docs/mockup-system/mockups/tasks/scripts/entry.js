import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
startMockup({'tasks-list': mountLifeShell, 'tasks-kanban': mountLifeShell, 'tasks-planning': mountLifeShell});
