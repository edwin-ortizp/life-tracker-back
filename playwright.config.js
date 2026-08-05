import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de navegador del sistema de diseño.
 *
 * Todo lo que puede variar entre entornos queda fijado aquí: navegador,
 * viewport, idioma, zona horaria, reloj, fuentes y animaciones. Las capturas
 * se generan y comparan contra el mismo entorno automatizado.
 */

export const VIEWPORTS = {
    mobile: { width: 390, height: 844 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 },
};

export const BASE_URL = process.env.UI_BASE_URL ?? 'http://127.0.0.1:8020';

export default defineConfig({
    testDir: './tests/Browser',
    outputDir: './storage/framework/testing/playwright',
    snapshotPathTemplate: '{testDir}/__baselines__/{testFilePath}/{arg}{ext}',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [['github'], ['list']] : [['list']],

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.01,
            animations: 'disabled',
            caret: 'hide',
            scale: 'css',
        },
    },

    use: {
        baseURL: BASE_URL,
        locale: 'es-ES',
        timezoneId: 'America/Bogota',
        colorScheme: 'light',
        reducedMotion: 'reduce',
        deviceScaleFactor: 1,
        viewport: VIEWPORTS.desktop,
        trace: 'retain-on-failure',
        ...devices['Desktop Chrome'],
    },

    projects: [
        { name: 'interaction', testMatch: /interaction\.spec\.js/ },
        { name: 'accessibility', testMatch: /accessibility\.spec\.js/ },
        { name: 'responsive', testMatch: /responsive\.spec\.js/ },
        { name: 'visual', testMatch: /visual\.spec\.js/ },
    ],

    webServer: {
        command: 'php artisan serve --host=127.0.0.1 --port=8020',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        // La barra de depuración se inyecta en el HTML y contaminaría tanto las
        // capturas como el análisis de accesibilidad.
        env: { DEBUGBAR_ENABLED: 'false' },
    },
});
