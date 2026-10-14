import test from 'node:test';
import assert from 'node:assert/strict';
import { energyPricing, pricingNumber } from '../../resources/js/energy-pricing.js';

const draft = () => energyPricing({ order: [], calculated: null, source: 'gasolina', unit: 'gal' });
const values = { quantity: '10', unit_price: '5000', cost: '50000' };
for (const pair of [['quantity', 'unit_price'], ['quantity', 'cost'], ['unit_price', 'cost']]) {
    for (const order of [pair, [...pair].reverse()]) {
        test(`calculates the third value from ${order.join(' then ')}`, () => {
            const state = draft();
            order.forEach(field => state.input(field, values[field]));
            assert.deepEqual(state.values, values);
            assert.equal(state.calculated, Object.keys(values).find(field => !pair.includes(field)));
        });
    }
}
test('partial decimals and clearing never replace the active input; blur restores an empty value', () => {
    const state = draft();
    state.input('unit_price', '5000'); state.input('cost', '50000');
    for (const text of ['', '.', '95.', '95,', '95,50']) {
        state.input('cost', text);
        assert.equal(state.values.cost, text);
        assert.equal(state.values.unit_price, '5000');
    }
    assert.equal(state.values.quantity, '0.02');
    state.input('cost', '50000'); state.input('cost', '');
    assert.equal(state.values.cost, '');
    state.blur('cost');
    assert.equal(state.values.cost, '50000');
});
test('editing derived values changes the pair without circular updates', () => {
    const state = draft();
    state.input('quantity', '10'); state.input('cost', '50000');
    state.input('unit_price', '6000');
    assert.equal(state.values.quantity, '8.33');
    state.input('quantity', '10');
    assert.equal(state.values.cost, '60000');
    assert.equal(state.values.unit_price, '6000');
});
test('division by zero and invalid decimals do not produce non-finite results', () => {
    const state = draft(); state.input('unit_price', '0'); state.input('cost', '100');
    assert.equal(state.values.quantity, '');
    for (const text of ['.', '1.', '1,', 'NaN', 'Infinity', '1,2.3', '-1', '1e3']) assert.equal(pricingNumber(text), null);
    assert.equal(pricingNumber('0,25'), .25);
});
test('editing a different energy unit resets the draft but a new record retains existing rules', () => {
    const state = energyPricing({ ...values, order: ['quantity', 'cost'], calculated: 'unit_price', editing: true, source: 'gasolina', unit: 'gal' });
    state.syncSource('electrico', 'kWh');
    assert.deepEqual(state.values, { quantity: '', unit_price: '', cost: '' });
    assert.deepEqual(state.order, []);
});
test('save sends the complete draft once and releases busy state after failures', async () => {
    const state = draft(); state.input('unit_price', '5000'); state.input('cost', '50000');
    let calls = 0;
    const wire = { saveEnergyLog: async payload => { calls++; assert.equal(payload.quantity, '10'); throw Error('network'); } };
    const saving = state.savePricing(wire); await state.savePricing(wire);
    await assert.rejects(saving, /network/); assert.equal(calls, 1); assert.equal(state.busy, false);
});
