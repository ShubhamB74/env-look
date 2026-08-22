// Zero-dependency ANSI helpers. Disabled automatically when stdout isn't a
// TTY (e.g. piped into a file or CI log viewer that doesn't render color).
const enabled = process.stdout.isTTY && !process.env.NO_COLOR;

function wrap(code) {
  return (str) => (enabled ? `\x1b[${code}m${str}\x1b[0m` : String(str));
}

module.exports = {
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  cyan: wrap(36),
  bold: wrap(1),
  dim: wrap(2),
};
