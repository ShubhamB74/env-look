const test = require('node:test');
const assert = require('node:assert/strict');
const { generateExample } = require('../src/generate');

test('strips values but keeps keys', () => {
  const out = generateExample('FOO=supersecret\nBAR=alsosecret');
  assert.equal(out.includes('supersecret'), false);
  assert.equal(out.includes('alsosecret'), false);
  assert.match(out, /^FOO=/m);
  assert.match(out, /^BAR=/m);
});

test('preserves comments and blank lines', () => {
  const out = generateExample('# Database config\nDB_HOST=localhost\n\n# API\nAPI_KEY=xyz');
  assert.match(out, /# Database config/);
  assert.match(out, /# API/);
});

test('deduplicates a key that appears twice in source, with a warning comment', () => {
  const out = generateExample('FOO=1\nFOO=2');
  const matches = out.match(/^FOO=/gm);
  assert.equal(matches.length, 1);
  assert.match(out, /duplicate key/);
});
