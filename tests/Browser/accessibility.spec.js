import AxeBuilder from '@axe-core/playwright';
import { test, expect, CATALOG_COMPONENTS, ARCHETYPES, archetypeUrl } from './support/fixtures.js';

const RULES = [
    'aria-allowed-attr',
    'aria-required-attr',
    'aria-roles',
    'aria-valid-attr-value',
    'button-name',
    'color-contrast',
    'duplicate-id-aria',
    'form-field-multiple-labels',
    'heading-order',
    'label',
    'link-name',
    'list',
    'listitem',
    'select-name',
];

// La barra de depuración local no forma parte del sistema de diseño.
const analyze = (page) => new AxeBuilder({ page }).withRules(RULES).exclude('.phpdebugbar').analyze();

const describeViolations = (violations) => violations
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
    .join('\n');

test.describe('Accesibilidad automatizada', () => {
    for (const component of CATALOG_COMPONENTS) {
        test(`el componente ${component} no tiene infracciones detectables`, async ({ page }) => {
            await page.goto(`/ui-catalog/${component}`);

            const { violations } = await analyze(page);

            expect(violations, describeViolations(violations)).toEqual([]);
        });
    }

    for (const archetype of ARCHETYPES) {
        test(`el arquetipo ${archetype} no tiene infracciones detectables`, async ({ page }) => {
            await page.goto(archetypeUrl(archetype));

            const { violations } = await analyze(page);

            expect(violations, describeViolations(violations)).toEqual([]);
        });
    }

    test('un diálogo abierto conserva sus relaciones accesibles', async ({ page }) => {
        await page.goto('/ui-catalog/dialog');
        await page.getByRole('button', { name: 'Abrir diálogo', exact: true }).click();

        await expect(page.getByRole('dialog')).toBeVisible();

        const { violations } = await analyze(page);

        expect(violations, describeViolations(violations)).toEqual([]);
    });
});
