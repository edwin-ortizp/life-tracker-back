import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountHealthBody} from '@project/project-assets/health-body.js';
startMockup({'health-index': mountLifeShell, 'health-body': mountHealthBody});
