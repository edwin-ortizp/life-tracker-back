const fields = ['quantity', 'unit_price', 'cost'];

export function pricingNumber(value) {
    const text = String(value ?? '').trim().replace(',', '.');
    return /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(text) && Number.isFinite(Number(text)) ? Number(text) : null;
}

export function energyPricing(initial) {
    return {
        values: Object.fromEntries(fields.map(field => [field, String(initial[field] ?? '')])),
        order: [...initial.order], calculated: initial.calculated, busy: false,
        source: initial.source, unit: initial.unit,
        syncSource(source, unit) {
            if (initial.editing && unit !== this.unit) {
                this.values = Object.fromEntries(fields.map(field => [field, '']));
                this.order = []; this.calculated = null;
            }
            this.source = source; this.unit = unit;
        },
        input(field, value) {
            this.values[field] = value;
            if (this.calculated === field) this.calculated = null;
            this.order = [...this.order.filter(item => item !== field), field];
            this.calculate(field);
        },
        blur(field) {
            if (this.values[field].trim() === '') {
                const others = fields.filter(item => item !== field && pricingNumber(this.values[item]) !== null);
                if (others.length === 2) { this.order = others; this.calculated = field; }
            }
            this.calculate();
        },
        calculate(active = null) {
            const inputs = this.order.filter(field => field !== this.calculated && pricingNumber(this.values[field]) !== null).slice(-2);
            if (inputs.length !== 2) {
                // Keep the last preview while an input is empty/partial. On blur
                // it can supply the second value needed to restore a cleared field.
                return;
            }
            const target = fields.find(field => !inputs.includes(field));
            if (target === active) return;
            const q = pricingNumber(this.values.quantity), p = pricingNumber(this.values.unit_price), c = pricingNumber(this.values.cost);
            const result = target === 'cost' ? q * p : target === 'quantity' ? (p > 0 ? c / p : null) : (q > 0 ? c / q : null);
            this.calculated = target;
            this.values[target] = result !== null && Number.isFinite(result) ? String(Math.round((result + Number.EPSILON) * 100) / 100) : '';
        },
        async savePricing(wire) {
            if (this.busy) return;
            this.busy = true;
            try { await wire.saveEnergyLog({ ...this.values, order: this.order, calculated: this.calculated }); }
            finally { this.busy = false; }
        },
    };
}

export function registerEnergyPricing(Alpine) { Alpine.data('energyPricing', energyPricing); }
