'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { snapshot } = require('../src/scenario');
module.exports = async function checkCoffee(page, fixture, output) {
  fs.cpSync(path.resolve(__dirname, '../demo-project/images'), path.join(fixture, 'images'), { recursive: true });
  for (const stage of [0, 1, 2]) {
    for (const [name, content] of Object.entries(snapshot(stage))) fs.writeFileSync(path.join(fixture, name), content);
    await page.goto(pathToFileURL(path.join(fixture, 'index.html')).href);
    await page.locator('img').evaluateAll(images => images.forEach(img => { img.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
    assert.equal(await page.locator('.drink-row').count(), 6);
    assert.equal(await page.locator('img').count(), stage ? 3 : 1);
    assert.equal(await page.locator('.menu-group').count(), stage ? 2 : 0);
    assert.equal(await page.locator('[data-add]').count(), stage === 2 ? 6 : 0);
    if (stage) {
      assert.equal(await page.locator('.menu-group').first().locator('.drink-row').count(), 4);
      assert.equal(await page.locator('.menu-group').last().locator('.drink-row').count(), 2);
    }
    for (const width of [375, 760, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (stage === 2) {
        assert.equal(await page.locator('.add-drink').evaluateAll(buttons => buttons.every(button => {
          const outer = button.getBoundingClientRect(), icon = button.querySelector('.plus-icon').getBoundingClientRect();
          return Math.abs(outer.x + outer.width / 2 - icon.x - icon.width / 2) < 1 && Math.abs(outer.y + outer.height / 2 - icon.y - icon.height / 2) < 1;
        })), true);
      }
    }
    await page.screenshot({ path: path.join(output, `coffee-stage-${stage}.png`), fullPage: true });
  }
  await page.getByRole('button', { name: 'Adicionar Espresso ao pedido', exact: true }).click();
  assert.equal(await page.locator('#order-drawer').isVisible(), false);
  assert.equal(await page.locator('[data-add="espresso"]').evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator('#launcher-total').textContent(), 'R$ 8,00');
  await page.locator('#view-order').click();
  assert.equal(await page.locator('#order-drawer').isVisible(), true);
  assert.equal(await page.locator('#close-order').evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator('#order-total').textContent(), 'R$ 8,00');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#order-drawer').isVisible(), false);
  assert.equal(await page.locator('#view-order').evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: 'Adicionar Espresso ao pedido', exact: true }).click();
  assert.equal(await page.locator('#order-drawer').isVisible(), false);
  assert.equal(await page.locator('.order-item').count(), 1);
  assert.equal(await page.locator('#order-total').textContent(), 'R$ 16,00');
  await page.locator('#view-order').click();
  await page.getByRole('button', { name: 'Continuar escolhendo' }).click();
  await page.getByRole('button', { name: 'Adicionar Cold Brew ao pedido', exact: true }).click();
  assert.equal(await page.locator('#order-drawer').isVisible(), false);
  await page.locator('#view-order').click();
  assert.equal(await page.locator('.order-item').count(), 2);
  assert.equal(await page.locator('#order-total').textContent(), 'R$ 32,00');
  await page.getByRole('button', { name: 'Aumentar Espresso', exact: true }).click();
  assert.equal(await page.locator('#order-total').textContent(), 'R$ 40,00');
  await page.getByRole('button', { name: 'Diminuir Espresso', exact: true }).press('Enter');
  assert.equal(await page.locator('#order-total').textContent(), 'R$ 32,00');
  assert.equal(await page.getByRole('button', { name: 'Diminuir Espresso', exact: true }).evaluate(el => el === document.activeElement), true);
  await page.screenshot({ path: path.join(output, 'coffee-order-drawer.png') });
  await page.getByRole('button', { name: 'Remover Cold Brew', exact: true }).click();
  assert.equal(await page.locator('#order-total').textContent(), 'R$ 16,00');
  assert.equal(await page.locator('#close-order').evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: 'Diminuir Espresso', exact: true }).click({ clickCount: 2 });
  assert.equal(await page.locator('#order-empty').isVisible(), true);
  assert.equal(await page.locator('#clear-order').isDisabled(), true);
  await page.getByRole('button', { name: 'Fechar pedido' }).click();
  await page.getByRole('button', { name: 'Adicionar Americano ao pedido', exact: true }).click();
  await page.locator('#view-order').click();
  await page.getByRole('button', { name: 'Limpar pedido', exact: true }).click();
  assert.equal(await page.locator('#order-total').textContent(), 'R$ 0,00');
  await page.getByRole('button', { name: 'Fechar pedido' }).click();
  await page.setViewportSize({ width: 375, height: 850 });
  await page.getByRole('button', { name: 'Adicionar Mocha gelado ao pedido', exact: true }).click();
  assert.equal(await page.locator('#order-drawer').isVisible(), false);
  await page.locator('#view-order').click();
  assert.equal(await page.locator('#order-drawer').evaluate(el => el.scrollWidth <= el.clientWidth), true);
  await page.getByRole('button', { name: 'Fechar pedido' }).click();
  assert.equal(await page.locator('#launcher-total').textContent(), 'R$ 18,00');
  await page.locator('#menu').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, 'coffee-mobile.png') });
  await page.getByRole('button', { name: 'Ver pedido: 1 bebida, R$ 18,00', exact: true }).click();
  assert.equal(await page.locator('#order-total').textContent(), 'R$ 18,00');
  await page.reload();
  assert.equal(await page.locator('#order-drawer').isVisible(), false);
  assert.equal(await page.locator('#launcher-total').textContent(), 'R$ 0,00');
};
