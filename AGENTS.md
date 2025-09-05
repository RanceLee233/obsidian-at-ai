# Repository Guidelines

This repository contains an Obsidian community plugin written in TypeScript with a bundled runtime artifact. Use this guide to build, test manually, and contribute safely.

## Project Structure & Module Organization
- `src/` — TypeScript sources
  - `main.ts` (plugin entry), `ui/` (modals), `settings/`, `templates/`, `ai/` (providers), `trigger/`, `i18n/`.
- `styles.css` — plugin styles; includes modal/layout rules.
- `manifest.json` — Obsidian plugin manifest.
- `main.js` — built artifact shipped to the vault.
- `esbuild.config.mjs`, `tsconfig.json` — build config.
- `install-local.sh` — copy built files into a vault (`.obsidian/plugins/obsidian-at-ai/`).
- Docs: `README.md`, `USAGE.md`, `LOCAL-TESTING.md`, `CLAUDE.md`.

## Build, Test, and Development Commands
- `npm run build` — type-checks then bundles to `main.js` via esbuild.
- `./install-local.sh "/path/to/Vault"` — installs `main.js`, `manifest.json`, `styles.css` into the target vault.
- Manual reload: toggle the plugin in Obsidian or restart the app.

Example:
```
npm run build && ./install-local.sh "$HOME/Documents/MyVault"
```

## Coding Style & Naming Conventions
- Language: TypeScript (ESNext). Two-space indentation, semicolons required.
- Filenames: PascalCase for classes/components (e.g., `ModelManagerModal.ts`), camelCase for utilities.
- Keep modules focused; avoid unrelated refactors. Prefer explicit types over `any`.
- CSS: BEM-like or feature-scoped classes; do not inline styles in TS.

## Testing Guidelines
- No formal test suite yet. Validate via manual flows in `LOCAL-TESTING.md`:
  1) Build and install to a sample vault.
  2) Verify trigger `@ai + space`, model manager, and template rendering.
  3) Use DevTools Console for errors.
- Add lightweight unit tests only if a framework is introduced in this repo.

## Commit & Pull Request Guidelines
- Commits: concise, imperative, scoped. Suggested format:
  - `feat(ui): add preview panel to AI modal`
  - `fix(templates): create default files on reload`
- PRs: include summary, motivation, screenshots/gifs for UI, and reproduction/verification steps. Link related issues.

## Security & Configuration Tips
- Never commit secrets. API keys live in plugin settings, not in the repo.
- Handle network errors; don’t log raw credentials. Validate base URLs.

## Architecture Overview (Quick)
- UI requests route through `AIProviderManager` using model/provider adapters; templates load from the vault folder and render with `{{context}}`.
