import { test as base, expect } from '@playwright/test';

/** Instante fijo para que ninguna captura dependa de la fecha real. */
export const FROZEN_TIME = new Date('2026-03-17T09:00:00-05:00');

export const CATALOG_COMPONENTS = [
    'action', 'icon-action', 'destructive-action', 'field', 'select', 'textarea',
    'chip', 'badge', 'card', 'progress', 'icon', 'filter-bar', 'filter-menu',
    'metric', 'metric-grid', 'section', 'list', 'list-item', 'dialog', 'sheet',
    'snackbar', 'state', 'flow-steps',
];

export const ARCHETYPES = ['list', 'detail', 'dashboard', 'daily-log', 'settings', 'guided-flow'];

export const archetypeUrl = (archetype) => `/ui-catalog/arquetipo/${archetype}`;

/**
 * Contexto determinista: reloj congelado, sin recursos externos, sin
 * animaciones y con una pila de fuentes local para que el texto mida igual en
 * cualquier máquina.
 */
export const test = base.extend({
    page: async ({ page }, use) => {
        await page.clock.install({ time: FROZEN_TIME });

        // Ningún recurso externo: las capturas no pueden depender de una CDN.
        await page.route('**/*', (route) => {
            const url = new URL(route.request().url());

            return url.hostname === '127.0.0.1' || url.hostname === 'localhost'
                ? route.continue()
                : route.abort();
        });

        await page.addInitScript(() => {
            document.addEventListener('DOMContentLoaded', () => {
                const style = document.createElement('style');
                style.textContent = `
                    .phpdebugbar, .phpdebugbar-openhandler { display: none !important; }
                    * { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important; }
                    /* La tipografía de iconos vive en una CDN bloqueada: se sustituye por
                       una marca del mismo tamaño para que la geometría siga siendo real. */
                    .bi::before { content: "\\25A0"; display: inline-block; width: 1em; text-align: center; }
                    *, *::before, *::after {
                        animation-duration: 0s !important;
                        animation-delay: 0s !important;
                        transition-duration: 0s !important;
                        transition-delay: 0s !important;
                    }
                `;
                document.head.appendChild(style);
            });
        });

        await use(page);
    },
});

export { expect };
