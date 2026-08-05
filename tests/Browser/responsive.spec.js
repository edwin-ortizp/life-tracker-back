import { test, expect, ARCHETYPES, archetypeUrl } from './support/fixtures.js';
import { VIEWPORTS } from '../../playwright.config.js';

const overflows = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

test.describe('Adaptación responsive de los arquetipos', () => {
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
        test.describe(`viewport ${name} (${viewport.width}px)`, () => {
            test.use({ viewport });

            for (const archetype of ARCHETYPES) {
                test(`el arquetipo ${archetype} conserva sus acciones sin desplazamiento horizontal`, async ({ page }) => {
                    await page.goto(archetypeUrl(archetype));

                    await expect(page.locator(`[data-archetype="${archetype}"]`)).toBeVisible();
                    await expect(page.locator('h1')).toHaveCount(1);

                    // La acción principal sigue siendo alcanzable en cualquier ancho.
                    const actions = page.locator('[data-region="actions"]');

                    if (await actions.count()) {
                        await expect(actions.getByRole('button').or(actions.getByRole('link')).first()).toBeVisible();
                    }

                    expect(await overflows(page), 'la página no debe desplazarse horizontalmente').toBe(false);
                });
            }

            test('el contexto se mantiene accesible aunque cambie de posición', async ({ page }) => {
                await page.goto(archetypeUrl('list'));

                const context = page.locator('[data-region="context"]');

                await expect(context).toBeVisible();

                const order = await page.evaluate(() => {
                    const content = document.querySelector('[data-region="content"]');
                    const rail = document.querySelector('[data-region="context"]');

                    return content.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING ? 'after' : 'before';
                });

                expect(order, 'el rail debe seguir al contenido principal').toBe('after');
            });

            test('la búsqueda y los filtros siguen siendo operables', async ({ page }) => {
                await page.goto(archetypeUrl('list'));

                await expect(page.locator('.md-search-bar__input')).toBeVisible();
                await expect(page.locator('.md-chip-rail .md-chip').first()).toBeVisible();
            });
        });
    }

    test('el contenido extenso no rompe el catálogo en móvil', async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.mobile);

        for (const component of ['chip', 'metric', 'card', 'list-item', 'field']) {
            await page.goto(`/ui-catalog/${component}`);

            expect(await overflows(page), `${component} desborda en móvil`).toBe(false);
        }
    });
});
