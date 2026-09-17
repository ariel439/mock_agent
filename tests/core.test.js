'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const demo = require('../src/demo');
const { snapshot } = require('../src/scenario');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 't-code-unit-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  demo.initialize(root);
  return root;
}
test('two sequential tickets, completion guard, reset and replay', t => {
  const root = fixture(t);
  assert.equal(demo.readStage(root), 0);
  assert.equal(demo.advance(root).ticket.id, 'TCODE-101');
  assert.equal(demo.readStage(root), 1);
  assert.equal((fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/class="drink-card"/g) || []).length, 6);
  assert.equal(demo.advance(root).ticket.id, 'TCODE-102');
  for (const name of demo.files) assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), snapshot(2)[name]);
  assert.throws(() => demo.advance(root), /Both tickets/);
  demo.reset(root);
  for (const name of demo.files) assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), snapshot(0)[name]);
  assert.equal(demo.advance(root).ticket.id, 'TCODE-101');
});
test('manual edits block the next ticket without changing files or stage', t => {
  const root = fixture(t);
  fs.appendFileSync(path.join(root, 'styles.css'), '\n/* user edit */');
  assert.throws(() => demo.advance(root), /manual changes/);
  assert.equal(demo.readStage(root), 0);
  assert.equal(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), snapshot(0)['index.html']);
  assert.match(fs.readFileSync(path.join(root, 'styles.css'), 'utf8'), /user edit/);
});
test('reset only touches known files and requires a recognized marker', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'notes.md'), 'Keep me');
  fs.mkdirSync(path.join(root, 'images'));
  fs.writeFileSync(path.join(root, 'images', 'cafe.jpg'), 'photo bytes');
  demo.advance(root); demo.reset(root);
  assert.equal(fs.readFileSync(path.join(root, 'notes.md'), 'utf8'), 'Keep me');
  assert.equal(fs.readFileSync(path.join(root, 'images', 'cafe.jpg'), 'utf8'), 'photo bytes');
  fs.writeFileSync(path.join(root, demo.marker), '{}');
  assert.throws(() => demo.reset(root), /not a recognized/);
});
test('workspace discovery supports the parent and rejects ambiguity', t => {
  const root = fixture(t);
  assert.equal(demo.findRoot([root]), root);
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 't-code-parent-'));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  const child = path.join(parent, 'demo-project'); demo.initialize(child);
  assert.equal(demo.findRoot([parent]), child);
  assert.throws(() => demo.findRoot([root, parent]), /only one/);
  assert.throws(() => demo.findRoot([]), /Open the supplied/);
});
test('unsafe file types and invalid stages cannot be overwritten', t => {
  const root = fixture(t);
  fs.unlinkSync(path.join(root, 'app.js')); fs.mkdirSync(path.join(root, 'app.js'));
  assert.throws(() => demo.reset(root), /Unsafe demo file/);
  assert.throws(() => snapshot(3), /Invalid demo stage/);
});
test('initialize refuses a populated directory', t => {
  const root = fixture(t);
  assert.throws(() => demo.initialize(root), /empty folder/);
});
test('reset migrates a previous Service Hub marker to the coffee scenario', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, demo.marker), JSON.stringify({ demo: 't-code-service-hub', version: 1, stage: 2 }));
  demo.reset(root);
  assert.equal(demo.readStage(root), 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, demo.marker), 'utf8')).demo, 't-code-soft-rock-coffee');
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /Soft Rock Coffee/);
});
