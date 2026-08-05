import { test, expect, CATALOG_COMPONENTS, ARCHETYPES, archetypeUrl } from './support/fixtures.js';
import { VIEWPORTS } from '../../playwright.config.js';

/**
 * Referencias visuales.
 *
 * Actualizar un baseline es una acción explícita: `npm run test:visual:update`.
 * Una diferencia no aprobada impide considerar conforme el cambio.
 */

const settle = async (page) => {
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts?.ready);
};

test.describe('Regresión visual del catálogo', () => {
    for (const component of CATALOG_COMPONENTS) {
        test(`el componente ${component} coincide con su referencia`, async ({ page }) => {
            await page.goto(`/ui-catalog/${component}`);
            await settle(page);

            await expect(page.locator('.md-catalog__examples')).toHaveScreenshot(`componente-${component}.png`);
        });
    }
});

test.describe('Regresión visual de los arquetipos', () => {
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
        for (const archetype of ARCHETYPES) {
            test(`el arquetipo ${archetype} coincide con su referencia en ${name}`, async ({ page }) => {
                await page.setViewportSize(viewport);
                await page.goto(archetypeUrl(archetype));
                await settle(page);

                await expect(page).toHaveScreenshot(`arquetipo-${archetype}-${name}.png`, { fullPage: true });
            });
        }
    }
});
