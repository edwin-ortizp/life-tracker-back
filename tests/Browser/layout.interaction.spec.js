import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, closeSync, openSync } from 'node:fs';
import path from 'node:path';

let server, habit;
test.beforeAll(async () => {
    test.setTimeout(60000);
    const directory = path.resolve('storage/framework/testing');
    mkdirSync(directory, { recursive: true });
    const database = path.join(directory, 'layout-browser.sqlite');
    closeSync(openSync(database, 'a'));
    const env = { ...process.env, APP_ENV: 'testing', DB_CONNECTION: 'sqlite', DB_DATABASE: database, DB_URL: '', CACHE_STORE: 'array', SESSION_DRIVER: 'file', DEBUGBAR_ENABLED: 'false', APP_CONFIG_CACHE: path.join(directory, 'unused-layout-config.php') };
    habit = execFileSync('php', ['tests/Browser/support/layout-fixture.php'], { env, encoding: 'utf8' }).trim();
    server = spawn('php', ['-S', '127.0.0.1:8031', path.resolve('vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')], { cwd: path.resolve('public'), env, stdio: 'ignore', windowsHide: true });
    for (let i = 0; i < 60; i++) {
        try { if ((await fetch('http://127.0.0.1:8031/login')).ok) return; } catch {}
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw Error('Testing server did not start');
});
test.afterAll(() => server?.kill());
test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico', { exact: true }).fill('layout@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill('browser-test-password');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await page.waitForURL(url => !url.pathname.includes('/login'));
});

for (const width of [390, 768, 1440, 1920, 2560]) {
    test(`Salud y Tareas a ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        for (const route of ['/health', '/tasks/list']) {
            await page.goto(route);
            await expect(page.locator('.lt-main')).toBeVisible();
            await page.waitForFunction(() => window.Livewire && window.Alpine);
            await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: route }).toBe(true);
            const main = await page.locator('.lt-main').boundingBox();
            expect(main.width).toBeLessThanOrEqual(1800);
            if (width === 2560) expect(main.width).toBeCloseTo(1800, 2);
            if (route.includes('tasks') && width >= 1280) {
                const columns = await page.locator('.task-list-layout').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' '));
                expect(columns[1]).toBe('320px');
            }
            if (width === 1920) await page.screenshot({ path: `storage/framework/testing/playwright/layout/${route.includes('tasks') ? 'tasks' : 'health'}-1920.png` });
        }
    });
}

test('exercise search, keyboard, Escape, reopening and registration', async ({ page }) => {
    await page.goto('/habits');
    await page.locator(`[wire\\:click="toggleHabit(${habit})"]`).click();
    const dialog = page.locator('#habit-action-prompt');
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole('combobox');
    await expect(input).not.toHaveValue('');
    await input.fill('TÉNIS');
    await expect(dialog.getByRole('option', { name: 'Tenis', exact: true })).toBeVisible();
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(input).toHaveValue('Tenis');
    await input.click();
    await input.fill('zzzz');
    await expect(dialog.getByText('Sin resultados')).toBeVisible();
    await input.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(input).toHaveValue('Tenis');
    await input.click();
    await input.fill('ciclismo');
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(input).toHaveValue('Ciclismo');
    const accessibility = await new AxeBuilder({ page }).include('#habit-action-prompt .md-combobox').analyze();
    expect(accessibility.violations).toEqual([]);
    await dialog.getByRole('button', { name: 'Registrar', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await page.goto('/exercise');
    await expect(page.locator('tbody .md-table__title').filter({ hasText: 'Ciclismo' })).toBeVisible();
});
