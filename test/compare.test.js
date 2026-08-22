const test = require('node:test');
const assert = require('node:assert/strict');
const { compareEnv, hasIssues } = require('../src/compare');

test('reports no issues when files match', () => {
  const report = compareEnv('FOO=bar\nBAZ=qux', 'FOO=\nBAZ=');
  assert.equal(hasIssues(report), false);
});

test('detects missing keys', () => {
  const report = compareEnv('FOO=bar', 'FOO=\nBAZ=');
  assert.deepEqual(report.missing, ['BAZ']);
});

test('detects extra keys', () => {
  const report = compareEnv('FOO=bar\nEXTRA=1', 'FOO=');
  assert.deepEqual(report.extra, ['EXTRA']);
});

test('detects empty values', () => {
  const report = compareEnv('FOO=\nBAR=set', 'FOO=\nBAR=');
  assert.deepEqual(report.empty, ['FOO']);
});

test('detects duplicate keys with line numbers', () => {
  const report = compareEnv('FOO=1\nFOO=2', 'FOO=');
  assert.equal(report.duplicates.length, 1);
  assert.equal(report.duplicates[0].key, 'FOO');
  assert.deepEqual(report.duplicates[0].lines, [1, 2]);
});

test('hasIssues is true when any category is non-empty', () => {
  assert.equal(hasIssues({ missing: ['A'], extra: [], empty: [], duplicates: [] }), true);
  assert.equal(hasIssues({ missing: [], extra: [], empty: [], duplicates: [] }), false);
});
