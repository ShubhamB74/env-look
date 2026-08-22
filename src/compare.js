const { parseEnvContent } = require('./parser');

/**
 * @typedef {Object} CompareReport
 * @property {string[]} missing - keys present in the example file but absent from the env file
 * @property {string[]} extra - keys present in the env file but absent from the example file
 * @property {string[]} empty - keys in the env file whose value is an empty string
 * @property {{key: string, lines: number[]}[]} duplicates - keys defined more than once in the env file
 */

/**
 * @param {string} envContent
 * @param {string} exampleContent
 * @returns {CompareReport}
 */
function compareEnv(envContent, exampleContent) {
  const env = parseEnvContent(envContent);
  const example = parseEnvContent(exampleContent);

  const envKeys = new Set(env.byKey.keys());
  const exampleKeys = new Set(example.byKey.keys());

  const missing = [...exampleKeys].filter((k) => !envKeys.has(k)).sort();
  const extra = [...envKeys].filter((k) => !exampleKeys.has(k)).sort();

  const empty = env.entries
    .filter((e) => e.value === '')
    .map((e) => e.key)
    .sort();

  const duplicates = [...env.byKey.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([key, entries]) => ({ key, lines: entries.map((e) => e.line) }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return { missing, extra, empty, duplicates };
}

/**
 * @param {CompareReport} report
 * @returns {boolean} true if the report contains any issue at all
 */
function hasIssues(report) {
  return (
    report.missing.length > 0 ||
    report.extra.length > 0 ||
    report.empty.length > 0 ||
    report.duplicates.length > 0
  );
}

module.exports = { compareEnv, hasIssues };
