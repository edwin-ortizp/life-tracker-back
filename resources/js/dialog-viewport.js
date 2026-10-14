// Scoped to modal surfaces: desktop and unrelated overlays retain their geometry.
export function registerDialogViewport(Alpine) {
    Alpine.directive('dialog-viewport', (el, { expression }, { evaluateLater, effect, cleanup }) => {
        const mobile = window.matchMedia('(max-width: 767.98px)');
        const viewport = window.visualViewport;
        let active = false;
        const update = () => {
            if (active && mobile.matches) {
                el.style.setProperty('--dialog-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
                el.style.setProperty('--dialog-viewport-top', `${viewport?.offsetTop ?? 0}px`);
            } else {
                el.style.removeProperty('--dialog-viewport-height');
                el.style.removeProperty('--dialog-viewport-top');
            }
        };
        const events = [[viewport, 'resize'], [viewport, 'scroll'], [window, 'resize'], [mobile, 'change']];
        const toggle = open => {
            events.forEach(([target, event]) => target?.removeEventListener(event, update));
            active = !!open;
            if (active) events.forEach(([target, event]) => target?.addEventListener(event, update));
            update();
        };
        if (expression) { const read = evaluateLater(expression); effect(() => read(toggle)); }
        else toggle(true);
        cleanup(() => toggle(false));
    });
}
