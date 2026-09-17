'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { lineStats, summarizeChanges } = require('../src/changes');
const { snapshot } = require('../src/scenario');
test('line counts handle additions, removals, replacements and repeated lines', () => {
  assert.deepEqual(lineStats('', 'a\nb\n'), { additions: 2, deletions: 0 });
  assert.deepEqual(lineStats('a\nb\n', ''), { additions: 0, deletions: 2 });
  assert.deepEqual(lineStats('a\nb\nc\n', 'a\nx\nc\n'), { additions: 1, deletions: 1 });
  assert.deepEqual(lineStats('a\na\nb\n', 'a\nb\nb\n'), { additions: 1, deletions: 1 });
  assert.deepEqual(lineStats('a\r\nb\r\n', 'a\nb\n'), { additions: 0, deletions: 0 });
  assert.deepEqual(lineStats('\n', ''), { additions: 0, deletions: 1 });
  assert.deepEqual(lineStats('', ''), { additions: 0, deletions: 0 });
});
test('summaries omit unchanged files and include added/deleted files', () => {
  assert.deepEqual(summarizeChanges({ same: 'a', old: 'x\n' }, { same: 'a', new: 'x\ny\n' }), [
    { name: 'old', additions: 0, deletions: 1 }, { name: 'new', additions: 2, deletions: 0 }
  ]);
});
test('ticket diffs use readable lines and reflect the scoped menu change', () => {
  const before = snapshot(0), after = snapshot(1);
  const changes = summarizeChanges(before, after);
  assert.deepEqual(changes.map(file => file.name), ['index.html', 'styles.css']);
  assert.ok(changes[0].additions > 0 && changes[0].deletions > 0);
  assert.equal(changes[1].deletions, 0);
  assert.ok(after['index.html'].split('\n').length > 100);
  assert.ok(after['styles.css'].split('\n').length > 100);
  assert.match(after['index.html'], /Fique pela <em>boa companhia\.<\/em>/);
});
