import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    testMatch: 'purchases.interaction.spec.js',
    workers: 1,
    outputDir: '../../storage/framework/testing/playwright/purchases',
    use: { baseURL: 'http://127.0.0.1:8027', browserName: 'chromium', locale: 'es-CO', timezoneId: 'America/Bogota', trace: 'retain-on-failure' },
});
