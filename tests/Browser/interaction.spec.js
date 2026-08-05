import { test, expect } from './support/fixtures.js';

test.describe('Teclado y foco en los componentes canónicos', () => {
    test('el campo canónico relaciona etiqueta, ayuda y error con su control', async ({ page }) => {
        await page.goto('/ui-catalog/field');

        const control = page.locator('#field-due');

        await expect(control).toHaveAttribute('aria-invalid', 'true');
        await expect(control).toHaveAttribute('aria-describedby', 'field-due-error');
        await expect(page.locator('label[for="field-due"]')).toBeVisible();
        await expect(page.locator('#field-due-error')).toHaveAttribute('role', 'alert');

        await control.focus();
        await expect(control).toBeFocused();
    });

    test('el menú de filtro se abre, se recorre y se cierra con el teclado', async ({ page }) => {
        await page.goto('/ui-catalog/filter-menu');

        const trigger = page.locator('.md-chip-menu button.md-chip').first();
        const dropdown = page.locator('.md-chip-menu__dropdown').first();

        await expect(trigger).toHaveAttribute('aria-expanded', 'false');

        await trigger.focus();
        await page.keyboard.press('Enter');

        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(dropdown).toBeVisible();
        await expect(dropdown).toHaveAttribute('role', 'listbox');

        await page.keyboard.press('Tab');
        await expect(dropdown.locator('[role="option"]').first()).toBeFocused();
    });

    test('el diálogo recibe el foco, lo contiene y lo devuelve al activador', async ({ page }) => {
        await page.goto('/ui-catalog/dialog');

        const trigger = page.getByRole('button', { name: 'Abrir diálogo', exact: true });
        await trigger.focus();
        await trigger.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute('aria-modal', 'true');

        // El foco entra en la superficie.
        await expect(dialog.locator(':focus')).toHaveCount(1);

        // Y permanece contenido al recorrerla.
        const focusables = dialog.locator('a[href], button:not([disabled]), input:not([disabled])');
        const total = await focusables.count();

        for (let index = 0; index <= total; index += 1) {
            await page.keyboard.press('Tab');
            await expect(dialog.locator(':focus')).toHaveCount(1);
        }

        await page.keyboard.press('Escape');

        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(trigger).toBeFocused();
    });

    test('la hoja comparte el contrato de foco del diálogo', async ({ page }) => {
        await page.goto('/ui-catalog/sheet');

        const trigger = page.getByRole('button', { name: 'Abrir hoja', exact: true });
        await trigger.focus();
        await trigger.click();

        const sheet = page.getByRole('dialog');
        await expect(sheet).toBeVisible();
        await expect(sheet.locator(':focus')).toHaveCount(1);
        await expect(page.locator('body')).toHaveClass(/md-scroll-locked/);

        await page.keyboard.press('Escape');

        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(page.locator('body')).not.toHaveClass(/md-scroll-locked/);
    });

    test('el snackbar anuncia sin robar el foco', async ({ page }) => {
        await page.goto('/ui-catalog/snackbar');

        const trigger = page.getByRole('button', { name: 'Mostrar confirmación' });
        await trigger.focus();
        await trigger.click();

        const snackbar = page.getByRole('status').first();

        await expect(snackbar).toBeVisible();
        await expect(snackbar).toHaveAttribute('aria-live', 'polite');
        await expect(trigger).toBeFocused();

        await page.getByRole('button', { name: 'Deshacer' }).click();
        await expect(page.locator('.md-snackbar')).toHaveCount(0);
    });

    test('una acción destructiva material confirma antes de ejecutarse', async ({ page }) => {
        await page.goto('/ui-catalog/destructive-action');

        const trigger = page.getByRole('button', { name: 'Eliminar tarea', exact: true }).first();
        await trigger.focus();
        await trigger.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeVisible();

        await dialog.getByRole('button', { name: 'Cancelar' }).click();

        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(trigger).toBeFocused();
    });

    test('cada control operable muestra foco visible', async ({ page }) => {
        await page.goto('/ui-catalog/action');

        const button = page.getByRole('button', { name: 'Nueva tarea' });
        await button.focus();

        const outline = await button.evaluate((element) => {
            const styles = getComputedStyle(element);

            return { width: styles.outlineWidth, style: styles.outlineStyle };
        });

        expect(outline.style).not.toBe('none');
        expect(parseFloat(outline.width)).toBeGreaterThan(0);
    });

    test('una acción en carga no admite activaciones duplicadas', async ({ page }) => {
        await page.goto('/ui-catalog/action');

        const loading = page.locator('[aria-busy="true"]').first();

        await expect(loading).toBeDisabled();
    });
});
