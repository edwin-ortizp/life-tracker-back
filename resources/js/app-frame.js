/**
 * Marco de aplicacion: plataforma, transiciones de pantalla y estado de red.
 *
 * No hay una variante por dispositivo: el marco es el mismo en cualquier ancho
 * y el CSS decide que se ve. Aqui solo vive lo que el CSS no puede saber.
 */

/** Marca la plataforma en <html> para que el CSS pueda afinar por sistema. */
export function markPlatform() {
    const root = document.documentElement;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

    root.classList.toggle('is-ios', isIos);
    root.classList.toggle('is-standalone', isStandalone);
}

/**
 * Transiciones push entre pantallas.
 *
 * `wire:navigate` no expone un hook sincrono compatible con la View Transitions
 * API, asi que se envuelve el intercambio del DOM en `startViewTransition`
 * cuando el navegador la soporta. Sin soporte, o con movimiento reducido, la
 * navegacion sigue siendo instantanea en vez de romperse.
 */
export function registerPageTransitions() {
    if (!document.startViewTransition) {
        return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let release = null;

    document.addEventListener('livewire:navigate', () => {
        if (reduced.matches) {
            return;
        }

        const transition = document.startViewTransition(() => new Promise((resolve) => {
            release = resolve;
        }));

        // Si la navegacion se cancela, no dejamos la pagina congelada.
        transition.finished.catch(() => {}).finally(() => { release = null; });
    });

    document.addEventListener('livewire:navigated', () => {
        if (release) {
            release();
            release = null;
        }
    });
}

export function registerAppFrame(Alpine) {
    Alpine.data('ltConnection', () => ({
        offline: !navigator.onLine,

        init() {
            window.addEventListener('online', () => { this.offline = false; });
            window.addEventListener('offline', () => { this.offline = true; });
        },
    }));
}
