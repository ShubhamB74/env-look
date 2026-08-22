const { parseEnvContent } = require('./parser');

/**
 * Builds a .env.example body from a real .env file's content.
 * Preserves file order and comment lines, replaces every value with a
 * generic placeholder so nothing secret leaks into the example file.
 *
 * @param {string} envContent
 * @returns {string}
 */
function generateExample(envContent) {
  const lines = envContent.split(/\r?\n/);
  const { byKey } = parseEnvContent(envContent);
  const seen = new Set();

  const outLines = lines.map((rawLine) => {
    const trimmed = rawLine.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return rawLine;

    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(rawLine);
    if (!match) return rawLine;

    const key = match[1];
    // If a key is duplicated in the source .env, only emit it once in the example.
    if (seen.has(key)) return null;
    seen.add(key);

    const isDup = (byKey.get(key) || []).length > 1;
    const suffix = isDup ? '  # duplicate key found in source .env - resolve before committing' : '';
    return `${key}=${suffix}`;
  });

  return outLines.filter((l) => l !== null).join('\n').replace(/\n{3,}/g, '\n\n');
}

module.exports = { generateExample };
