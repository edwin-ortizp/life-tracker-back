import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, closeSync, openSync } from 'node:fs';
import path from 'node:path';

let server;
test.beforeAll(async () => {
    test.setTimeout(60_000);
    const directory = path.resolve('storage/framework/testing');
    mkdirSync(directory, { recursive: true });
    const database = path.join(directory, 'purchase-browser.sqlite');
    closeSync(openSync(database, 'a'));
    const env = { ...process.env, APP_ENV: 'testing', DB_CONNECTION: 'sqlite', DB_DATABASE: database, DB_URL: '', CACHE_STORE: 'array', SESSION_DRIVER: 'file', DEBUGBAR_ENABLED: 'false', TELESCOPE_ENABLED: 'false', NIGHTWATCH_ENABLED: 'false', APP_CONFIG_CACHE: path.join(directory, 'unused-purchase-config.php') };
    execFileSync('php', ['tests/Browser/support/purchase-fixture.php'], { env, stdio: 'pipe' });
    server = spawn('php', ['-S', '127.0.0.1:8027', path.resolve('vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')], { cwd: path.resolve('public'), env, stdio: 'pipe', windowsHide: true });
    let serverOutput = '';
    server.stdout.on('data', data => { serverOutput += data; });
    server.stderr.on('data', data => { serverOutput += data; });
    for (let attempt = 0; attempt < 60; attempt++) {
        try { if ((await fetch('http://127.0.0.1:8027/login')).ok) return; } catch {}
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error(`Isolated purchase server did not start: ${serverOutput}`);
});
test.afterAll(() => { server?.kill(); });

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    test(`purchase create, detail and edit at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('/login');
        await page.getByLabel('Correo electrónico').fill('purchase-browser@example.test');
        await page.getByLabel('Contraseña', { exact: true }).fill('browser-test-password');
        await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
        await page.waitForURL(url => !url.pathname.includes('/login'));
        await page.goto('/meals/shopping');
        if (viewport.width < 768) {
            await page.locator('.md-fab-split__compact').click();
        } else {
            await page.getByRole('button', { name: 'Más acciones de creación', exact: true }).click();
        }
        await page.getByRole('menuitem', { name: 'Registrar compra', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Registrar compra' });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('combobox', { name: 'Tienda', exact: true }).selectOption({ label: 'Tienda de prueba' });
        if (viewport.width < 768) await dialog.getByRole('button', { name: 'Mostrar u ocultar secciones' }).click();
        await dialog.getByRole('button', { name: 'Productos', exact: true }).click();
        const line = dialog.locator('fieldset').first();
        await line.getByRole('combobox', { name: 'Producto', exact: true }).selectOption({ label: 'Pan de prueba' });
        await line.getByLabel('Presentación').selectOption({ index: 1 });
        await line.getByRole('spinbutton', { name: 'Paquetes', exact: true }).fill('2');
        await line.getByLabel('Precio final por paquete').fill('10');
        await dialog.getByRole('button', { name: 'Añadir línea' }).click();
        const second = dialog.locator('fieldset').nth(1);
        await second.getByRole('combobox', { name: 'Producto', exact: true }).selectOption({ label: 'Leche de prueba' });
        await second.getByRole('spinbutton', { name: 'Paquetes', exact: true }).fill('1');
        await expect(dialog.getByRole('status')).toContainText('incompleta');
        const violations = (await new AxeBuilder({ page }).include('[role="dialog"]').withRules(['button-name', 'label', 'select-name', 'aria-valid-attr-value']).analyze()).violations;
        expect(violations).toEqual([]);
        expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
        await page.screenshot({ path: `storage/framework/testing/purchase-previews/editor-${viewport.width}.png` });
        await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
        await expect(dialog).not.toBeVisible();
        await page.goto('/meals/purchases');
        await expect(page.getByText('2 líneas', { exact: false }).first()).toBeVisible();
        if (viewport.width < 768) {
            await page.locator('.md-row-actions__more').first().click();
            await page.getByRole('menuitem', { name: 'Ver detalle', exact: true }).first().click();
        } else {
            await page.getByRole('button', { name: 'Ver detalle', exact: true }).first().click();
        }
        const detail = page.getByRole('dialog', { name: 'Detalle de compra' });
        await expect(detail).toContainText('Pan de prueba');
        await page.keyboard.press('Escape');
        await expect(detail).not.toBeVisible();
        await page.locator('.md-row-actions__more').first().click();
        await page.getByRole('menuitem', { name: 'Editar', exact: true }).first().click();
        const editor = page.getByRole('dialog', { name: 'Editar compra' });
        await expect(editor).toBeVisible();
        if (viewport.width < 768) await editor.getByRole('button', { name: 'Mostrar u ocultar secciones' }).click();
        await editor.getByRole('button', { name: 'Detalles', exact: true }).click();
        await editor.getByLabel('Notas').fill(`Editada desde ${viewport.width}px`);
        await editor.getByRole('button', { name: 'Guardar', exact: true }).click();
        await expect(editor).not.toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(errors).toEqual([]);
    });
}

