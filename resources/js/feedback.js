/**
 * Respuesta inmediata al tocar.
 *
 * Un toggle de habito o de tarea espera hoy la ida y vuelta al servidor antes de
 * mostrar nada, y en una conexion movil eso son cientos de milisegundos en los
 * que la aplicacion parece congelada. La directiva adelanta el resultado
 * probable y deja que la respuesta del servidor confirme o corrija: Livewire
 * repinta el elemento con su estado real, asi que no hay que revertir a mano.
 */

/** Vibracion muy corta, solo como acuse de recibo. */
export function haptic(pattern = 10) {
    try {
        navigator.vibrate?.(pattern);
    } catch {
        // Algunos navegadores la declaran y lanzan al usarla.
    }
}

export function registerFeedback(Alpine) {
    Alpine.directive('optimistic-toggle', (el) => {
        el.addEventListener('click', () => {
            // `aria-pressed` ya expresa el estado real y accesible del control,
            // asi que sirve tambien como fuente del estado adelantado.
            const pressed = el.getAttribute('aria-pressed') === 'true';

            el.setAttribute('aria-pressed', String(!pressed));
            el.classList.toggle('is-optimistic-on', !pressed);
            el.classList.toggle('is-optimistic-off', pressed);

            haptic();
        }, { capture: true });
    });

    // Acuse de recibo en acciones puntuales que no cambian de estado
    // (registrar un vaso de agua, completar y programar una repeticion).
    Alpine.directive('haptic', (el, { expression }) => {
        el.addEventListener('click', () => haptic(expression ? Number(expression) : 10), { capture: true });
    });
}
