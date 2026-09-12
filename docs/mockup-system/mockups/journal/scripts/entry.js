import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
startMockup({'journal-entries': mountLifeShell, 'journal-life': mountLifeShell, 'journal-week': mountLifeShell});
