'use strict';
// Count a shortest line edit using a rolling longest-common-subsequence table.
function lineStats(before, after) {
  const lines = text => {
    if (!text) return [];
    const result = text.replace(/\r\n/g, '\n').split('\n');
    if (result.at(-1) === '') result.pop();
    return result;
  };
  const left = lines(before), right = lines(after);
  let start = 0, endLeft = left.length, endRight = right.length;
  while (start < endLeft && start < endRight && left[start] === right[start]) start++;
  while (endLeft > start && endRight > start && left[endLeft - 1] === right[endRight - 1]) { endLeft--; endRight--; }
  const row = new Uint32Array(endRight - start + 1);
  for (let i = start; i < endLeft; i++) {
    let previous = 0;
    for (let j = start; j < endRight; j++) {
      const index = j - start + 1, above = row[index];
      row[index] = left[i] === right[j] ? previous + 1 : Math.max(row[index], row[index - 1]);
      previous = above;
    }
  }
  const common = row.at(-1);
  return { additions: endRight - start - common, deletions: endLeft - start - common };
}
function summarizeChanges(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(name => before[name] !== after[name])
    .map(name => ({ name, ...lineStats(before[name] || '', after[name] || '') }));
}
module.exports = { lineStats, summarizeChanges };
