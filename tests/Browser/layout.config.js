import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: '.', testMatch: 'layout.interaction.spec.js', workers: 1,
    outputDir: '../../storage/framework/testing/playwright/layout',
    use: { baseURL: 'http://127.0.0.1:8031', browserName: 'chromium', locale: 'es-CO', trace: 'retain-on-failure' },
});
