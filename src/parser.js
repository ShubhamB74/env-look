/**
 * Parses .env-style file content into structured entries.
 * Deliberately dependency-free and forgiving of quirks real .env files have:
 * comments, blank lines, quoted values, `export FOO=bar` style, and
 * duplicate keys (which we surface as a warning rather than silently
 * overwriting, since that's a common source of "why isn't my var set" bugs).
 */

/**
 * @typedef {Object} EnvEntry
 * @property {string} key
 * @property {string} value
 * @property {number} line - 1-indexed line number in the source file
 */

/**
 * @typedef {Object} ParseResult
 * @property {EnvEntry[]} entries - all key/value lines, in file order
 * @property {Map<string, EnvEntry[]>} byKey - key -> all entries for that key (length > 1 means duplicate)
 */

const KEY_LINE_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

/**
 * @param {string} content raw file contents
 * @returns {ParseResult}
 */
function parseEnvContent(content) {
  const lines = content.split(/\r?\n/);
  /** @type {EnvEntry[]} */
  const entries = [];
  /** @type {Map<string, EnvEntry[]>} */
  const byKey = new Map();

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) return;

    const match = KEY_LINE_RE.exec(rawLine);
    if (!match) return; // silently skip malformed lines; not this tool's job to lint syntax

    const key = match[1];
    let value = match[2].trim();
    value = stripQuotesAndInlineComment(value);

    const entry = { key, value, line: idx + 1 };
    entries.push(entry);

    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(entry);
  });

  return { entries, byKey };
}

/**
 * Handles `FOO="bar baz"`, `FOO='bar'`, and `FOO=bar # trailing comment`.
 * @param {string} value
 * @returns {string}
 */
function stripQuotesAndInlineComment(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  // Unquoted value: strip a trailing ` # comment` if present.
  const hashIdx = value.indexOf(' #');
  if (hashIdx !== -1) {
    return value.slice(0, hashIdx).trim();
  }
  return value;
}

module.exports = { parseEnvContent };
