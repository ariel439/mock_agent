'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { snapshot, tickets } = require('../src/scenario');
const root = path.resolve(__dirname, '..');
async function main() {
  const browser = await chromium.launch({ headless: true });
  const output = path.join(root, 'test-results'); fs.mkdirSync(output, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'soft-rock-ui-'));
  fs.cpSync(path.join(root, 'demo-project', 'images'), path.join(fixture, 'images'), { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = []; const network = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (/^https?:/.test(r.url())) network.push(r.url()); });
    for (const stage of [0, 1, 2]) {
      const files = snapshot(stage);
      for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(fixture, name), content);
      await page.goto(pathToFileURL(path.join(fixture, 'index.html')).href);
      await page.locator('img').evaluateAll(images => images.forEach(img => { img.loading = 'eager'; }));
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
      assert.equal(await page.locator('img').count(), stage ? 7 : 1);
      assert.equal(await page.locator('.drink-card:visible').count(), stage ? 6 : 0);
      await page.screenshot({ path: path.join(output, `page-stage-${stage}.png`), fullPage: true });
    }
    await page.getByRole('button', { name: 'Iced', exact: true }).click();
    assert.equal(await page.locator('.drink-card:visible').count(), 1);
    assert.equal(await page.locator('#result-count').textContent(), '1 drink on the menu');
    await page.getByRole('button', { name: 'Add Cold Brew to order' }).click();
    assert.equal(await page.locator('#order-total').textContent(), '$4.75');
    await page.getByRole('button', { name: 'Hot', exact: true }).click();
    assert.equal(await page.locator('.drink-card:visible').count(), 5);
    assert.equal(await page.locator('#order-total').textContent(), '$4.75');
    await page.getByRole('button', { name: 'Add Espresso to order', exact: true }).click({ clickCount: 2 });
    assert.equal(await page.locator('.order-item').count(), 2);
    assert.equal(await page.locator('#order-total').textContent(), '$10.75');
    await page.getByRole('button', { name: 'Increase Espresso', exact: true }).click();
    assert.equal(await page.locator('#order-total').textContent(), '$13.75');
    await page.getByRole('button', { name: 'Decrease Espresso', exact: true }).press('Enter');
    assert.equal(await page.locator('#order-total').textContent(), '$10.75');
    assert.equal(await page.getByRole('button', { name: 'Decrease Espresso', exact: true }).evaluate(el => el === document.activeElement), true);
    await page.getByRole('button', { name: 'Remove Cold Brew', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Hot', exact: true }).evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('#order-total').textContent(), '$6.00');
    await page.getByRole('button', { name: 'Decrease Espresso', exact: true }).click();
    await page.getByRole('button', { name: 'Decrease Espresso', exact: true }).click();
    assert.equal(await page.locator('#order-empty').isVisible(), true);
    await page.getByRole('button', { name: 'Add Mocha to order', exact: true }).click();
    await page.getByRole('button', { name: 'Clear order', exact: true }).click();
    assert.equal(await page.locator('#order-total').textContent(), '$0.00');
    assert.equal(await page.locator('#clear-order').isDisabled(), true);
    await page.getByRole('button', { name: 'All drinks', exact: true }).click();
    await page.getByRole('button', { name: 'Add Flat White to order', exact: true }).click();
    await page.getByRole('button', { name: 'Add Cold Brew to order', exact: true }).click();
    await page.screenshot({ path: path.join(output, 'coffee-order.png'), fullPage: true });
    await page.reload();
    assert.equal(await page.locator('#order-total').textContent(), '$0.00');
    for (const width of [375, 760, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const cols = await page.locator('.drink-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      assert.equal(cols, width === 375 ? 1 : width === 760 ? 2 : 3);
      if (width === 375) await page.screenshot({ path: path.join(output, 'coffee-mobile.png'), fullPage: true });
    }
    await page.setViewportSize({ width: 360, height: 850 });
    const chatHtml = fs.readFileSync(path.join(root, 'media/chat.html'), 'utf8')
      .replace(/<meta http-equiv="Content-Security-Policy"[^>]+>/, '')
      .replace('<link rel="stylesheet" href="{{css}}">', `<style>${fs.readFileSync(path.join(root, 'media/chat.css'), 'utf8')}</style>`)
      .replace('<script nonce="{{nonce}}" src="{{js}}"></script>', '');
    await page.setContent(chatHtml);
    await page.evaluate(() => { window.sent = []; window.acquireVsCodeApi = () => ({ postMessage: m => window.sent.push(m), getState: () => ({}), setState: () => {} }); });
    await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'media/chat.js'), 'utf8') });
    await page.screenshot({ path: path.join(output, 'chat-ready.png') });
    assert.equal(await page.locator('[data-ticket], #welcome, #preview, #step').count(), 0);
    assert.doesNotMatch(await page.locator('body').innerText(), /scripted|offline|demo|ticket/i);
    await page.getByRole('textbox', { name: 'Prompt', exact: true }).fill('First ticket');
    await page.locator('#prompt').press('Enter');
    assert.equal(await page.evaluate(() => window.sent.at(-1).text), 'First ticket');
    await page.evaluate(tickets => window.postMessage({ type: 'state', stage: 2, busy: false, error: '', messages: [{ role: 'user', text: '<img src=x onerror=alert(1)>' }, { role: 'assistant', text: tickets[1].summary, files: tickets[1].files, stage: 2 }] }, '*'), tickets);
    await page.waitForFunction(() => document.querySelectorAll('.file-row').length === 3);
    assert.equal(await page.locator('#messages img').count(), 0);
    assert.equal(await page.locator('#send').isDisabled(), true);
    await page.getByRole('button', { name: 'View app.js changes' }).click();
    assert.equal(await page.evaluate(() => window.sent.at(-1).type), 'diff');
    await page.screenshot({ path: path.join(output, 'chat-complete.png') });
    assert.deepEqual(errors, []); assert.deepEqual(network, []);
    console.log('Browser checks passed: local photos, all page stages, filters, order quantities/totals/removal/clear/reload, keyboard focus, responsive layout, chat, no HTTP requests.');
  } finally { await browser.close(); fs.rmSync(fixture, { recursive: true, force: true }); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
