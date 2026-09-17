'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { changeQuantity, totalCents, money } = require('../src/order');
const { drinks, snapshot } = require('../src/scenario');
test('duplicate additions combine, totals use integer cents and BRL labels', () => {
  let order = changeQuantity({}, 'espresso', 1, drinks);
  order = changeQuantity(order, 'espresso', 1, drinks);
  order = changeQuantity(order, 'cold-brew', 1, drinks);
  assert.deepEqual(order, { espresso: 2, 'cold-brew': 1 });
  assert.equal(totalCents(order, drinks), 3200);
  assert.equal(money(totalCents(order, drinks)), 'R$ 32,00');
  assert.equal(totalCents(changeQuantity(order, 'espresso', -1, drinks), drinks), 2400);
  assert.equal(order.espresso, 2);
});
test('zero removes items and invalid IDs or quantities cannot affect the order', () => {
  assert.deepEqual(changeQuantity({ espresso: 1 }, 'espresso', -1, drinks), {});
  assert.deepEqual(changeQuantity({}, 'espresso', -99, drinks), {});
  assert.deepEqual(changeQuantity({ espresso: 99 }, 'espresso', 1, drinks), { espresso: 99 });
  assert.deepEqual(changeQuantity({}, 'unknown', 1, drinks), {});
  assert.deepEqual(changeQuantity({}, 'espresso', 1.5, drinks), {});
  assert.equal(totalCents({}, drinks), 0);
});
test('first ticket only changes menu markup and appends menu styles', () => {
  const before = snapshot(0), after = snapshot(1);
  const stripMenu = html => html.replace(/<section id="menu"[\s\S]*?<section id="story"/, '<section id="story"');
  assert.equal(stripMenu(before['index.html']), stripMenu(after['index.html']));
  assert.equal(before['app.js'], after['app.js']);
  assert.ok(after['styles.css'].startsWith(before['styles.css']));
  for (const stage of [0, 1, 2]) {
    const html = snapshot(stage)['index.html'];
    assert.equal((html.match(/class="drink-row"/g) || []).length, 6);
    for (const drink of drinks) assert.ok(html.includes(money(drink.price)));
  }
  assert.doesNotMatch(after['index.html'], /data-add=|id="order-drawer"/);
  assert.match(snapshot(2)['index.html'], /id="order-drawer"/);
});
