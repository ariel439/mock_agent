'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSettings, models } = require('../src/settings');
function fixture() {
  const state = new Map(), secrets = new Map();
  const context = {
    globalState: { get: (key, fallback) => state.get(key) ?? fallback, update: async (key, value) => state.set(key, value) },
    secrets: { get: async key => secrets.get(key), store: async (key, value) => secrets.set(key, value) }
  };
  return { settings: createSettings(context), context, state, secrets };
}
test('settings persist the selected model and keep secrets out of public state', async () => {
  const { settings, context, state, secrets } = fixture();
  assert.equal((await settings.read()).hasSecret, false);
  assert.equal(models.length, 5);
  for (const model of models) {
    const result = await settings.save({ baseUrl: ' https://example.test/v1 ', secret: 'private-token', model });
    assert.equal(result.model, model);
    assert.equal(result.baseUrl, 'https://example.test/v1');
    assert.equal(result.hasSecret, true);
    assert.ok(!JSON.stringify(result).includes('private-token'));
    assert.ok(!JSON.stringify([...state]).includes('private-token'));
  }
  await settings.save({ baseUrl: 'http://localhost:8000/v1', secret: '', model: models[1] });
  assert.equal(secrets.get('tCode.apiSecret'), 'private-token');
  assert.equal((await createSettings(context).read()).model, models[1]);
  await settings.save({ baseUrl: 'https://example.test', secret: 'replacement', model: models[0] });
  assert.equal(secrets.get('tCode.apiSecret'), 'replacement');
});
test('invalid settings cannot mutate saved values', async () => {
  const { settings, state, secrets } = fixture();
  for (const input of [
    { baseUrl: 'bad', secret: 'key', model: models[0] },
    { baseUrl: 'file:///tmp', secret: 'key', model: models[0] },
    { baseUrl: 'https://user:pass@example.test', secret: 'key', model: models[0] },
    { baseUrl: 'https://example.test', secret: '', model: models[0] },
    { baseUrl: 'https://example.test', secret: 'key', model: 'unknown' }
  ]) await assert.rejects(() => settings.save(input));
  assert.equal(state.size, 0);
  assert.equal(secrets.size, 0);
});
