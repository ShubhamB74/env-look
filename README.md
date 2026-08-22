# envguard

Catch `.env` drift before it breaks a deploy.

`envguard` compares your `.env` against `.env.example` and tells you exactly what's out of sync — missing keys, stray keys nobody documented, empty values, and duplicate definitions. Zero dependencies, works in any Node project regardless of framework.

## The problem

Someone adds a new required env var, forgets to update `.env.example`, and three days later a teammate's local setup — or worse, a CI pipeline — breaks with a cryptic error, five layers away from the actual missing variable. `envguard` catches this in one command, and can gate CI so it never reaches production.

## Install

```bash
npm install -g envguard
```

Or run it without installing:

```bash
npx envguard check
```

## Usage

### Check for drift

```bash
envguard check
```

```
envguard checking .env against .env.example

✖ Missing (1) - in .env.example but not .env:
  - DB_PORT

⚠ Extra (1) - in .env but not .env.example:
  - EXTRA_LEGACY_VAR

⚠ Empty values (1):
  - API_KEY
```

Options:

| Flag | Description | Default |
|---|---|---|
| `--env <file>` | path to the env file to check | `.env` |
| `--example <file>` | path to the example file | `.env.example` |
| `--strict` | exit with code `1` if any issue is found | off |
| `--json` | print a machine-readable report instead | off |

### Generate `.env.example` from an existing `.env`

```bash
envguard init
```

Keeps every key, comment, and blank line from your `.env`, strips every real value, so nothing secret ends up in the file you commit.

Options: `--env <file>`, `--out <file>`, `--force` (overwrite if the output already exists).

## Using it in CI

```yaml
# GitHub Actions example
- name: Check env vars are in sync
  run: npx envguard check --strict
```

This fails the build the moment `.env.example` and the actual required config drift apart, instead of failing later at deploy time with a much less obvious error.

## What it checks

- **Missing** — keys documented in `.env.example` but absent from `.env`
- **Extra** — keys in `.env` that aren't documented in `.env.example` (often dead config nobody cleaned up)
- **Empty** — keys present but with no value set
- **Duplicates** — the same key defined more than once in `.env` (the last one silently wins, which is a common source of confusing bugs)

## Why zero dependencies

A tool that reads your environment configuration is a reasonable thing to be careful about. `envguard` ships with no runtime dependencies at all — nothing to audit beyond this repo's own code.

## Contributing

Issues and PRs welcome. Run the test suite with:

```bash
npm test
```

## License

MIT
