import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
startMockup({'meals-weekly': mountLifeShell, 'meals-recipes': mountLifeShell, 'meals-ingredients': mountLifeShell, 'meals-shopping': mountLifeShell});
