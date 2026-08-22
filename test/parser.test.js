const test = require('node:test');
const assert = require('node:assert/strict');
const { parseEnvContent } = require('../src/parser');

test('parses simple key=value pairs', () => {
  const { entries } = parseEnvContent('FOO=bar\nBAZ=qux');
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0], { key: 'FOO', value: 'bar', line: 1 });
  assert.deepEqual(entries[1], { key: 'BAZ', value: 'qux', line: 2 });
});

test('ignores comments and blank lines', () => {
  const { entries } = parseEnvContent('# a comment\n\nFOO=bar\n   \n# another');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].key, 'FOO');
});

test('strips double and single quotes', () => {
  const { entries } = parseEnvContent(`FOO="bar baz"\nQUX='hello world'`);
  assert.equal(entries[0].value, 'bar baz');
  assert.equal(entries[1].value, 'hello world');
});

test('strips trailing inline comment on unquoted values', () => {
  const { entries } = parseEnvContent('FOO=bar # this is a comment');
  assert.equal(entries[0].value, 'bar');
});

test('handles export prefix', () => {
  const { entries } = parseEnvContent('export FOO=bar');
  assert.equal(entries[0].key, 'FOO');
  assert.equal(entries[0].value, 'bar');
});

test('detects duplicate keys', () => {
  const { byKey } = parseEnvContent('FOO=one\nBAR=two\nFOO=three');
  assert.equal(byKey.get('FOO').length, 2);
  assert.equal(byKey.get('BAR').length, 1);
});

test('handles empty values', () => {
  const { entries } = parseEnvContent('FOO=');
  assert.equal(entries[0].value, '');
});

test('skips malformed lines without throwing', () => {
  const { entries } = parseEnvContent('not a valid line\nFOO=bar\n===broken===');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].key, 'FOO');
});
