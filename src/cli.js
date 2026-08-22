const fs = require('fs');
const path = require('path');
const { compareEnv, hasIssues } = require('./compare');
const { generateExample } = require('./generate');
const c = require('./colors');

const VERSION = require('../package.json').version;

const HELP = `
${c.bold('env-look')} - catch .env drift before it breaks a deploy

${c.bold('Usage')}
  env-look check [options]     Compare .env against .env.example (default command)
  env-look init [options]      Generate .env.example from an existing .env
  env-look --version           Print version
  env-look --help              Show this help

${c.bold('Options for "check"')}
  --env <file>          Path to the env file to check      (default: .env)
  --example <file>       Path to the example file           (default: .env.example)
  --strict               Exit with code 1 if any issue is found
  --json                 Print machine-readable JSON instead of a formatted report

${c.bold('Options for "init"')}
  --env <file>           Path to the source .env file        (default: .env)
  --out <file>            Path to write the example to        (default: .env.example)
  --force                 Overwrite the output file if it already exists

${c.bold('Examples')}
  env-look check
  env-look check --env .env.production --example .env.example --strict
  env-look check --json
  env-look init
`;

function readFileOrEmpty(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const flag = tok.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[flag] = next;
        i++;
      } else {
        args[flag] = true;
      }
    } else {
      args._.push(tok);
    }
  }
  return args;
}

function printReportHuman(report, envPath, examplePath) {
  console.log(`${c.bold('env-look')} checking ${c.cyan(envPath)} against ${c.cyan(examplePath)}\n`);

  if (!hasIssues(report)) {
    console.log(c.green('✔ No issues found. Your .env is in sync with .env.example.'));
    return;
  }

  if (report.missing.length) {
    console.log(c.red(`✖ Missing (${report.missing.length}) - in ${path.basename(examplePath)} but not ${path.basename(envPath)}:`));
    report.missing.forEach((k) => console.log(`  - ${k}`));
    console.log('');
  }

  if (report.extra.length) {
    console.log(c.yellow(`⚠ Extra (${report.extra.length}) - in ${path.basename(envPath)} but not ${path.basename(examplePath)}:`));
    report.extra.forEach((k) => console.log(`  - ${k}`));
    console.log('');
  }

  if (report.empty.length) {
    console.log(c.yellow(`⚠ Empty values (${report.empty.length}):`));
    report.empty.forEach((k) => console.log(`  - ${k}`));
    console.log('');
  }

  if (report.duplicates.length) {
    console.log(c.red(`✖ Duplicate keys (${report.duplicates.length}):`));
    report.duplicates.forEach((d) => console.log(`  - ${d.key} (lines ${d.lines.join(', ')})`));
    console.log('');
  }
}

function cmdCheck(args) {
  const envPath = args.env || '.env';
  const examplePath = args.example || '.env.example';

  const envContent = readFileOrEmpty(envPath);
  const exampleContent = readFileOrEmpty(examplePath);

  if (envContent === null || exampleContent === null) {
    const missingFile = envContent === null ? envPath : examplePath;
    console.error(c.red(`✖ File not found: ${missingFile}`));
    process.exit(2);
  }

  const report = compareEnv(envContent, exampleContent);

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReportHuman(report, envPath, examplePath);
  }

  if (args.strict && hasIssues(report)) {
    process.exit(1);
  }
}

function cmdInit(args) {
  const envPath = args.env || '.env';
  const outPath = args.out || '.env.example';

  const envContent = readFileOrEmpty(envPath);
  if (envContent === null) {
    console.error(c.red(`✖ File not found: ${envPath}`));
    process.exit(2);
  }

  if (fs.existsSync(outPath) && !args.force) {
    console.error(c.red(`✖ ${outPath} already exists. Use --force to overwrite.`));
    process.exit(2);
  }

  const example = generateExample(envContent);
  fs.writeFileSync(outPath, example + '\n', 'utf8');
  console.log(c.green(`✔ Wrote ${outPath}`));
}

function main(argv) {
  const args = parseArgs(argv);

  if (args.version) {
    console.log(VERSION);
    return;
  }
  if (args.help || args._.length === 0 && argv.length === 0) {
    // fallthrough handled below; no-op here
  }

  const command = args._[0] || 'check';

  if (args.help) {
    console.log(HELP);
    return;
  }

  switch (command) {
    case 'check':
      cmdCheck(args);
      break;
    case 'init':
      cmdInit(args);
      break;
    default:
      console.error(c.red(`✖ Unknown command: ${command}`));
      console.log(HELP);
      process.exit(2);
  }
}

module.exports = { main, parseArgs };
