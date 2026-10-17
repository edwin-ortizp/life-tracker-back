import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.', testMatch: 'tasks-settings.interaction.spec.js', workers: 1,
    outputDir: '../../storage/framework/testing/playwright/tasks-settings',
    use: { baseURL: 'http://127.0.0.1:8032', browserName: 'chromium', locale: 'es-CO', timezoneId: 'America/Bogota', trace: 'retain-on-failure' },
});
