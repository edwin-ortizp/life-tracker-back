const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusable(surface) {
    return [...surface.querySelectorAll(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
    );
}

/**
 * Superficies modales canónicas: diálogo y hoja.
 *
 * El foco entra en la superficie, permanece contenido mientras está abierta y
 * vuelve al control que la abrió al cerrarse. `Escape` emite `md-surface-close`
 * para que el estado lo maneje quien la declara.
 */
export function registerUiSurfaces(Alpine) {
    Alpine.directive('md-surface', (el, { modifiers }, { cleanup }) => {
        const invoker = document.activeElement;
        const locksScroll = !modifiers.includes('no-scroll-lock');

        if (locksScroll) {
            document.body.classList.add('md-scroll-locked');
        }

        if (!el.hasAttribute('tabindex')) {
            el.setAttribute('tabindex', '-1');
        }

        // Alpine puede inicializar la directiva antes de insertar la superficie
        // en el documento; se reintenta hasta que el foco entra de verdad.
        const focusInto = (attempt = 0) => {
            if (el.contains(document.activeElement) && document.activeElement !== document.body) {
                return;
            }

            if (el.isConnected) {
                const target = el.querySelector('[autofocus]') ?? focusable(el)[0] ?? el;
                target.focus({ preventScroll: true });
            }

            if (!el.contains(document.activeElement) && attempt < 3) {
                timers.push(setTimeout(() => focusInto(attempt + 1), 16));
            }
        };

        const timers = [setTimeout(() => focusInto(), 0)];

        const onKeydown = (event) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                el.dispatchEvent(new CustomEvent('md-surface-close', { bubbles: true }));
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const targets = focusable(el);

            if (targets.length === 0) {
                event.preventDefault();
                el.focus({ preventScroll: true });
                return;
            }

            const first = targets[0];
            const last = targets[targets.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        const onFocusIn = (event) => {
            if (!el.contains(event.target)) {
                (focusable(el)[0] ?? el).focus({ preventScroll: true });
            }
        };

        el.addEventListener('keydown', onKeydown);
        document.addEventListener('focusin', onFocusIn);

        cleanup(() => {
            timers.forEach(clearTimeout);
            el.removeEventListener('keydown', onKeydown);
            document.removeEventListener('focusin', onFocusIn);

            if (locksScroll) {
                document.body.classList.remove('md-scroll-locked');
            }

            if (invoker instanceof HTMLElement && document.body.contains(invoker)) {
                invoker.focus({ preventScroll: true });
            }
        });
    });
}
