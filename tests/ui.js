'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { snapshot, tickets } = require('../src/scenario');
const root = path.resolve(__dirname, '..');
async function main() {
  const browser = await chromium.launch({ headless: true });
  const output = path.join(root, 'test-results'); fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = []; const network = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (/^https?:/.test(r.url())) network.push(r.url()); });
    for (const stage of [0, 1, 2]) {
      const files = snapshot(stage);
      const html = files['index.html'].replace('<link rel="stylesheet" href="styles.css">', `<style>${files['styles.css']}</style>`).replace('<script src="app.js" defer></script>', '').replace('</body>', `<script>${files['app.js']}</script></body>`);
      await page.setContent(html);
      assert.equal(await page.locator('.service-card:visible').count(), stage ? 6 : 0);
      await page.screenshot({ path: path.join(output, `page-stage-${stage}.png`), fullPage: true });
    }
    await page.getByRole('button', { name: 'Security', exact: true }).click();
    assert.equal(await page.locator('.service-card:visible').count(), 2);
    await page.getByRole('searchbox').fill('  ACCESS  ');
    assert.equal(await page.locator('.service-card:visible').count(), 1);
    assert.equal(await page.locator('#result-count').textContent(), '1 service found');
    await page.getByRole('searchbox').fill('no-such-service');
    assert.equal(await page.locator('.service-card:visible').count(), 0);
    assert.equal(await page.locator('#empty-state').isVisible(), true);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    assert.equal(await page.locator('.service-card:visible').count(), 6);
    assert.equal(await page.getByRole('searchbox').inputValue(), '');
    for (const width of [375, 760, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const cols = await page.locator('.service-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      assert.equal(cols, width === 375 ? 1 : width === 760 ? 2 : 3);
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
    console.log('Browser checks passed: page stages, combined filters, empty state, responsive layout, chat send, escaping, diff action, no HTTP requests.');
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
