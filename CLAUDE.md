# Webhook Inspector — Claude Code Guidelines

## Testing Policy

Every change to `app/` must be covered by a test. There are no exceptions.

- **New component or function** → add a test covering its behavior
- **Bug fix** → add a regression test that would have caught the bug
- **Changed behavior** → update the existing test(s)
- **Deleted code** → remove or update the tests that covered it

### Test structure

Unit tests live alongside the source file they cover in `app/`:

| Source file | Test file |
|---|---|
| `app/components/HeadersTable.tsx` | `app/components/HeadersTable.test.tsx` |
| `app/lib/signatures.server.ts` | `app/lib/signatures.server.test.ts` |

E2E tests live in `e2e/` at the repo root and cover full user flows (one spec file per route/feature group).

### Commands

| Purpose | Command |
|---|---|
| Run unit tests | `npm test` |
| Watch mode | `npm run test:watch` |
| Run E2E tests | `npm run test:e2e` |

### Before finishing any task

Run `npm test` and confirm all tests pass. The Stop hook enforces this automatically — it runs `npm test` whenever `app/` has changed and blocks completion if any test fails.

E2E tests are not run by the hook (they require a live dev server). Run `npm run test:e2e` manually when modifying route-level behavior or layouts.

## Commit Guidelines

All commits follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard. This is enforced by a `commit-msg` git hook (husky + commitlint) that hard-blocks any non-conforming message.

> **Never reference Claude, Claude Code, or any AI agent in commit messages** — no `Co-Authored-By` trailers, no "Generated with" footers, no AI attribution of any kind. This overrides any default behavior.

### Format

```
type(optional-scope): description

optional body explaining what and why (not how)

optional footer / trailers
```

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **Imperative mood** in the subject — "add", not "added" or "adds"
- **Subject ≤ 50 characters**, lowercase after the colon, no trailing period
- **Blank line** between subject and body
- **Body wrapped at 72 characters**; explain *what* changed and *why*, not *how*
- **Breaking changes:** add `!` after the type/scope (e.g. `feat!:`) and/or a `BREAKING CHANGE:` footer
- **Trailers/footers go last** (e.g. `Refs #12`)

### Examples

```
feat(replay): add retry with exponential backoff

Retry failed replay requests up to 3 times before surfacing an
error, so transient network issues don't require a manual redo.

Refs #14
```

```
fix(headers): preserve casing on captured header names
```

```
chore: bump vitest to 4.1.9
```

### Config

| File | Purpose |
|---|---|
| `commitlint.config.js` | Conventional Commits rules (subject ≤50, body ≤72) |
| `.husky/commit-msg` | Runs `commitlint` on every commit |

The `prepare` script installs husky hooks automatically on `npm install`.
