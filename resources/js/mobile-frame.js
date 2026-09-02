/**
 * Marco movil: app bar, tab bar persistida, transiciones de pantalla y
 * deteccion de plataforma.
 *
 * Todo lo que depende del dispositivo se resuelve aqui y no en Blade, porque el
 * HTML lo sirve una capa de vistas ya decidida en servidor y no debe volver a
 * ramificarse en cliente.
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

export function registerMobileFrame(Alpine) {
    Alpine.data('ltMobileFrame', () => ({
        scrolled: false,
        offline: !navigator.onLine,

        init() {
            const onScroll = () => { this.scrolled = window.scrollY > 4; };

            onScroll();
            window.addEventListener('scroll', onScroll, { passive: true });

            window.addEventListener('online', () => { this.offline = false; });
            window.addEventListener('offline', () => { this.offline = true; });
        },

        goBack() {
            // `history.back()` dentro de la propia app usa el cache de
            // `wire:navigate`; si se entro directo a esta URL no hay historia
            // propia y se vuelve al inicio.
            if (window.history.length > 1) {
                window.history.back();
                return;
            }

            window.location.href = '/';
        },
    }));

    Alpine.data('ltMobileTabs', () => ({
        path: window.location.pathname,
        hidden: false,

        init() {
            // La barra esta persistida entre navegaciones, asi que el estado
            // activo se refresca aqui: el servidor ya no la vuelve a pintar.
            document.addEventListener('livewire:navigated', () => {
                this.path = window.location.pathname;
                this.hidden = false;
            });

            let last = window.scrollY;

            window.addEventListener('scroll', () => {
                const current = window.scrollY;
                const delta = current - last;

                // Umbral para que un temblor de dedo no oculte la barra.
                if (Math.abs(delta) > 8) {
                    this.hidden = delta > 0 && current > 96;
                    last = current;
                }
            }, { passive: true });
        },

        isActive(el) {
            const prefix = el.dataset.ltMatch;

            return prefix === '/' ? this.path === '/' : this.path.startsWith(prefix);
        },
    }));
}
