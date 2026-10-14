import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: '.', testMatch: 'energy.interaction.spec.js', workers: 1,
    outputDir: '../../storage/framework/testing/playwright/energy',
    use: { baseURL: 'http://127.0.0.1:8029', browserName: 'chromium', locale: 'es-CO', timezoneId: 'America/Bogota', trace: 'retain-on-failure' },
});
