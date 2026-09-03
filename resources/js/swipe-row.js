/**
 * Fila de lista con acciones por gesto (solo se activa en pantallas angostas:
 * en escritorio el `.ta-split` de siempre sigue siendo el control visible y
 * estos manejadores nunca reciben eventos `touch`).
 *
 * Deslizar a la derecha completa/reabre directamente: es una acción reversible,
 * así que se puede confirmar con el propio gesto. Deslizar a la izquierda solo
 * revela "Editar" y "Eliminar" como botones — nunca se ejecutan por el gesto
 * en sí, hay que tocarlos, porque eliminar no es reversible.
 */
export function registerSwipeRow(Alpine) {
    Alpine.data('swipeRow', ({ onComplete } = {}) => ({
        dx: 0,
        dragging: false,
        locked: null, // null: sin decidir | true: gesto horizontal | false: gesto vertical (se cede al scroll)
        revealed: false,
        startX: 0,
        startY: 0,
        baseX: 0,

        REVEAL: 132,
        COMMIT: 96,

        onStart(e) {
            const t = e.touches[0];
            this.startX = t.clientX;
            this.startY = t.clientY;
            this.baseX = this.revealed ? -this.REVEAL : 0;
            this.dragging = true;
            this.locked = null;
        },

        onMove(e) {
            if (!this.dragging) return;
            const t = e.touches[0];
            const diffX = t.clientX - this.startX;
            const diffY = t.clientY - this.startY;

            if (this.locked === null) {
                if (Math.abs(diffX) < 8 && Math.abs(diffY) < 8) return;
                this.locked = Math.abs(diffX) > Math.abs(diffY);
                if (!this.locked) { this.dragging = false; return; }
            }

            if (e.cancelable) e.preventDefault();

            let x = this.baseX + diffX;
            // No se deja arrastrar más allá de lo que hace falta para revelar
            // o completar: pasado ese punto seguir tirando no cambia nada.
            x = Math.max(-this.REVEAL - 24, Math.min(this.COMMIT + 24, x));
            this.dx = x;
        },

        onEnd() {
            if (!this.dragging) return;
            this.dragging = false;
            if (this.locked !== true) { return; }

            if (this.dx > this.COMMIT) {
                this.dx = 0;
                this.revealed = false;
                onComplete && onComplete();
                return;
            }

            if (this.dx <= -this.REVEAL / 2) {
                this.dx = -this.REVEAL;
                this.revealed = true;
            } else {
                this.dx = 0;
                this.revealed = false;
            }
        },

        close() {
            this.dx = 0;
            this.revealed = false;
        },
    }));
}
