'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { tickets, snapshot } = require('../src/scenario');
const { summarizeChanges } = require('../src/changes');
const root = path.resolve(__dirname, '..');
async function main() {
  const browser = await chromium.launch({ headless: true });
  const output = path.join(root, 'test-results'); fs.mkdirSync(output, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'coffee-ui-'));
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = []; const network = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (/^https?:/.test(r.url())) network.push(r.url()); });
    await require('./coffee-ui')(page, fixture, output);
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
    const models = require('../src/settings').models;
    await page.evaluate(models => window.postMessage({ type: 'settings', baseUrl: '', model: models[0], models, hasSecret: false }, '*'), models);
    await page.getByRole('button', { name: 'Configurações', exact: true }).click();
    assert.equal(await page.locator('#composer').isVisible(), false);
    assert.deepEqual(await page.locator('#agent-model option').allTextContents(), models);
    await page.getByLabel('URL da API').fill('https://example.test/v1');
    await page.getByLabel('Chave secreta').fill('test-only-secret');
    assert.equal(await page.locator('#api-secret').getAttribute('type'), 'password');
    await page.getByLabel('Modelo do agente').selectOption('Qwen 3.6 120B');
    await page.getByRole('button', { name: 'Salvar configurações' }).click();
    assert.deepEqual(await page.evaluate(() => window.sent.at(-1)), { type: 'saveSettings', baseUrl: 'https://example.test/v1', secret: 'test-only-secret', model: 'Qwen 3.6 120B' });
    await page.evaluate(() => window.postMessage({ type: 'settingsError', message: 'Não foi possível salvar.' }, '*'));
    await page.waitForFunction(() => !document.querySelector('#save-settings').disabled);
    assert.equal(await page.locator('#settings-status').textContent(), 'Não foi possível salvar.');
    await page.getByRole('button', { name: 'Salvar configurações' }).click();
    await page.evaluate(models => window.postMessage({ type: 'settings', baseUrl: 'https://example.test/v1', model: models[1], models, hasSecret: true, saved: true }, '*'), models);
    await page.waitForFunction(() => document.querySelector('#api-secret').value === '');
    assert.equal(await page.locator('#settings-status').textContent(), 'Configurações salvas.');
    for (const width of [280, 360, 600]) {
      await page.setViewportSize({ width, height: 850 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await page.setViewportSize({ width: 360, height: 850 });
    await page.screenshot({ path: path.join(output, 'chat-settings.png') });
    await page.getByRole('button', { name: 'Voltar à conversa' }).click();
    assert.equal(await page.locator('#composer').isVisible(), true);
    await page.getByRole('textbox', { name: 'Mensagem', exact: true }).fill('First ticket');
    await page.locator('#prompt').press('Enter');
    assert.equal(await page.evaluate(() => window.sent.at(-1).text), 'First ticket');
    const changes = summarizeChanges(snapshot(1), snapshot(2));
    await page.evaluate(({ tickets, changes }) => window.postMessage({ type: 'state', stage: 2, busy: false, error: '', messages: [{ role: 'user', text: '<img src=x onerror=alert(1)>' }, { role: 'assistant', text: tickets[1].summary, files: tickets[1].files, changes, stage: 2 }] }, '*'), { tickets, changes });
    await page.waitForFunction(() => document.querySelectorAll('.file-row').length === 3);
    assert.equal(await page.locator('#messages img').count(), 0);
    assert.equal(await page.locator('#send').isDisabled(), true);
    await page.getByRole('button', { name: 'Ver alterações em app.js' }).click();
    assert.equal(await page.evaluate(() => window.sent.at(-1).type), 'diff');
    assert.equal(await page.locator('.change-summary strong').textContent(), '3 arquivos alterados');
    assert.equal(await page.locator('.change-summary .addition').textContent(), '+' + changes.reduce((n, file) => n + file.additions, 0));
    assert.equal(await page.locator('.change-summary .deletion').textContent(), '−' + changes.reduce((n, file) => n + file.deletions, 0));
    for (let i = 0; i < changes.length; i++) {
      assert.equal(await page.locator('.file-row').nth(i).locator('.addition').textContent(), '+' + changes[i].additions);
      assert.equal(await page.locator('.file-row').nth(i).locator('.deletion').textContent(), '−' + changes[i].deletions);
    }
    await page.getByRole('button', { name: 'Revisar', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => window.sent.at(-1)), { type: 'review', stage: 2 });
    await page.getByRole('button', { name: 'Revisar alterações em app.js', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => window.sent.at(-1)), { type: 'diff', name: 'app.js', stage: 2 });
    for (const width of [280, 360]) {
      await page.setViewportSize({ width, height: 850 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await page.screenshot({ path: path.join(output, 'chat-complete.png') });
    assert.deepEqual(errors, []); assert.deepEqual(network, []);
    console.log('Browser checks passed: coffee stages, local photos, menu-only redesign, order drawer, quantities/removal/clear, focus, responsive layout, reload, chat settings, no HTTP requests.');
  } finally { await browser.close(); fs.rmSync(fixture, { recursive: true, force: true }); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
