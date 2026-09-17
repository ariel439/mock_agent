'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { changeQuantity, totalCents } = require('../src/order');
const { drinks } = require('../src/scenario');
test('quantities combine duplicate drinks and total in integer cents', () => {
  let order = changeQuantity({}, 'espresso', 1, drinks);
  order = changeQuantity(order, 'espresso', 1, drinks);
  order = changeQuantity(order, 'cold-brew', 1, drinks);
  assert.deepEqual(order, { espresso: 2, 'cold-brew': 1 });
  assert.equal(totalCents(order, drinks), 1075);
  const next = changeQuantity(order, 'espresso', -1, drinks);
  assert.equal(totalCents(next, drinks), 775);
  assert.equal(order.espresso, 2);
});
test('zero removes the row, quantities stay bounded and unknown drinks are ignored', () => {
  assert.deepEqual(changeQuantity({ espresso: 1 }, 'espresso', -1, drinks), {});
  assert.deepEqual(changeQuantity({}, 'espresso', -10, drinks), {});
  assert.deepEqual(changeQuantity({ espresso: 99 }, 'espresso', 1, drinks), { espresso: 99 });
  assert.deepEqual(changeQuantity({}, 'unknown', 1, drinks), {});
  assert.deepEqual(changeQuantity({}, 'espresso', 1.5, drinks), {});
  assert.equal(totalCents({}, drinks), 0);
});
