/**
 * Vista del cuerpo: el mapa (SVG estático bajo `wire:ignore`) y la lista de zonas
 * comparten `data-zone`. Los niveles de calor llegan como JSON fuera del
 * `wire:ignore`, así que se vuelven a pintar cada vez que Livewire lo actualiza.
 */
export function registerHealthBodyMap(Alpine) {
    Alpine.data('healthBodyMap', () => ({
        view: 'front',
        model: 'male',
        selected: null,
        hint: null,
        zones: {},

        get detail() {
            return this.selected ? { ...this.zones[this.selected] } : null;
        },

        init() {
            this.read();
            this.render();

            const host = this.$root.querySelector('[data-body-levels-host]');
            this.observer = new MutationObserver(() => { this.read(); this.paint(); });
            this.observer.observe(host, { childList: true, subtree: true, characterData: true });

            // La lista vive en el panel lateral, fuera de este componente.
            this.controller = new AbortController();
            const options = { signal: this.controller.signal };
            const zoneOf = (target) => target.closest?.('[data-zone]');
            document.addEventListener('pointerover', (e) => { const el = zoneOf(e.target); if (el) this.link(el.dataset.zone, true); }, options);
            document.addEventListener('pointerout', (e) => { const el = zoneOf(e.target); if (el && !el.contains(e.relatedTarget)) this.link(el.dataset.zone, false); }, options);
            document.addEventListener('focusin', (e) => { const el = zoneOf(e.target); if (el) this.link(el.dataset.zone, true); }, options);
            document.addEventListener('focusout', (e) => { const el = zoneOf(e.target); if (el) this.link(el.dataset.zone, false); }, options);

            this.$root.addEventListener('click', (e) => {
                const shape = e.target.closest('svg [data-zone]');
                if (shape) this.select(shape.dataset.zone, true);
            });
            this.$root.addEventListener('keydown', (e) => {
                const shape = e.target.closest('svg [data-zone]');
                if (shape && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.select(shape.dataset.zone, true); }
            });
        },

        destroy() {
            this.observer?.disconnect();
            this.controller?.abort();
        },

        read() {
            const source = this.$root.querySelector('[data-body-levels]');
            try { this.zones = JSON.parse(source?.textContent || '{}'); } catch { this.zones = {}; }
        },

        byZone(id) {
            return document.querySelectorAll(`[data-zone="${id}"]`);
        },

        shapes() {
            return this.$root.querySelectorAll('svg [data-zone]');
        },

        paint() {
            this.shapes().forEach((shape) => {
                const zone = this.zones[shape.dataset.zone] ?? { label: shape.getAttribute('aria-label'), count: 0, level: 0 };
                shape.classList.remove('health-heat-0', 'health-heat-1', 'health-heat-2', 'health-heat-3', 'health-heat-4');
                shape.classList.add(`health-heat-${zone.level}`);
                shape.classList.toggle('is-registered', zone.count > 0);
                shape.setAttribute('aria-label', `${zone.label}: ${zone.count} ${zone.count === 1 ? 'evento' : 'eventos'}`);
            });
        },

        render() {
            // <svg> no expone la propiedad `hidden`: se alterna el atributo.
            this.$root.querySelectorAll('[data-body-side]').forEach((svg) => {
                svg.toggleAttribute('hidden', svg.dataset.bodySide !== this.view || svg.dataset.bodyModel !== this.model);
            });
            this.paint();
        },

        setView(view) {
            this.view = view;
            this.hint = null;
            this.render();
        },

        setModel(model) {
            this.model = model;
            this.render();
        },

        // No todos los modelos dibujan todas las zonas en ambas vistas.
        viewsOf(id) {
            return [...new Set([...this.$root.querySelectorAll(`[data-body-model="${this.model}"] [data-zone="${id}"]`)]
                .map((el) => el.closest('[data-body-side]').dataset.bodySide))];
        },

        link(id, on) {
            this.byZone(id).forEach((el) => el.classList.toggle('is-linked', on));
            const views = this.viewsOf(id);
            this.hint = on && views.length && !views.includes(this.view) ? views[0] : null;
        },

        select(id, scroll = false) {
            document.querySelectorAll('.is-selected[data-zone]').forEach((el) => el.classList.remove('is-selected'));
            this.byZone(id).forEach((el) => el.classList.add('is-selected'));
            this.selected = this.zones[id] ? id : null;
            if (scroll) document.querySelector(`.health-zone-row[data-zone="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        },

        locate(id) {
            const views = this.viewsOf(id);
            if (views.length && !views.includes(this.view)) this.setView(views[0]);
            this.select(id);
            this.shapes().forEach((el) => {
                if (el.dataset.zone !== id) return;
                el.classList.remove('is-pulse');
                void el.getBoundingClientRect();
                el.classList.add('is-pulse');
            });
            this.$root.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        },
    }));
}
