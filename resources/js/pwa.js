/**
 * Instalacion y funcionamiento sin conexion.
 *
 * El service worker existia en el repositorio desde hace tiempo pero no lo
 * registraba nadie, asi que la aplicacion nunca llego a comportarse como una
 * PWA. Aqui se registra y se resuelve el flujo de instalacion, que es distinto
 * en Android (evento `beforeinstallprompt`) y en iOS (no existe: hay que
 * explicar los pasos de Safari).
 */

const DISMISSED_KEY = 'lt-install-dismissed-at';
const DISMISS_DAYS = 30;

export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    // En local el worker cachearia el bundle entre recargas de Vite.
    if (import.meta.env.DEV) {
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Un fallo al registrar no puede tumbar la aplicacion: sin worker
            // simplemente no hay modo sin conexion.
        });
    });
}

function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

function wasRecentlyDismissed() {
    try {
        const at = Number(window.localStorage.getItem(DISMISSED_KEY));

        return Number.isFinite(at) && at > 0
            && (Date.now() - at) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}

function remember() {
    try {
        window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
        // Modo privado: se volvera a ofrecer, que es preferible a fallar.
    }
}

export function registerInstallPrompt(Alpine) {
    let deferred = null;

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferred = event;
        window.dispatchEvent(new CustomEvent('lt-install-available'));
    });

    Alpine.data('ltInstallPrompt', () => ({
        open: false,
        platform: 'android',

        init() {
            if (isStandalone() || wasRecentlyDismissed()) {
                return;
            }

            const isIos = /iphone|ipod|ipad/i.test(navigator.userAgent);

            if (isIos) {
                // Safari no expone `beforeinstallprompt`: solo se pueden dar
                // las instrucciones, y solo tienen sentido en el propio Safari.
                if (/safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)) {
                    this.platform = 'ios';
                    // Se espera un poco para no interrumpir el primer vistazo.
                    setTimeout(() => { this.open = true; }, 4000);
                }

                return;
            }

            window.addEventListener('lt-install-available', () => {
                this.platform = 'android';
                this.open = true;
            });
        },

        async install() {
            if (!deferred) {
                this.dismiss();

                return;
            }

            this.open = false;
            deferred.prompt();
            await deferred.userChoice;
            deferred = null;
            remember();
        },

        dismiss() {
            this.open = false;
            remember();
        },
    }));
}
