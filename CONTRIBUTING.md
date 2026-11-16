# Contributing

Thanks for your interest. This is a personal website, so most changes come from the owner, but bug reports and small fixes are welcome.

## Ground rules

- `main` is protected. Every change goes through a pull request, and CI must pass before merge.
- Keep pull requests small and focused on one thing.
- Do not add secrets, personal contact details, or images that still carry EXIF/GPS metadata.
- Security issues go through [SECURITY.md](SECURITY.md), not public issues.
- Be respectful. This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Workflow

1. Open an issue first for anything larger than a typo, so we can agree on the approach.
2. Create a branch from `main`, named by type:
   `feat/…`, `fix/…`, `content/…`, `ci/…` or `docs/…`.
3. Make the change and run the checks locally (see below).
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   `feat: add case-study section`, `fix(nav): close menu on Escape`.
5. Open a pull request and fill in the template. The code owner is requested for review automatically.
6. Pull requests are **squash-merged**, so the PR title becomes the commit on `main`. Make it a good Conventional Commit.

## Local setup

Requirements: Node.js 20 or newer (see `.nvmrc`).

```bash
npm ci          # install linters
npm start       # serve the site at http://localhost:8080
npm run lint    # HTMLHint, Stylelint and ESLint
```

No Node? Any static server works: `python3 -m http.server 8080`.

## Code style

- Formatting basics are set in [`.editorconfig`](.editorconfig): UTF-8, LF, two-space indent.
- Plain HTML, CSS and JavaScript. No framework and no build step for the site itself.
- Animate only `transform` and `opacity`, and respect `prefers-reduced-motion`.
- Third-party scripts load from a CDN with a pinned version.
- UI work follows the design skills in [`.claude/skills/`](.claude/skills/): `awwwards` sets the art direction, and `ui-ux-pro-max` is used for lookups and QA.

## Images and media

- Prefer WebP or AVIF, and keep photos under about 300 KB.
- Strip metadata before committing, for example `exiftool -all= image.jpg`.
- Always set `alt` text and `width`/`height` attributes.

## CI checks

Every pull request runs:

| Check | What it does |
| --- | --- |
| Lint | HTMLHint, Stylelint and ESLint |
| Link check | lychee checks every link in the HTML and Markdown |
| Lighthouse | Performance, accessibility, best practices and SEO budgets |
| Dependency review | Blocks dependencies with known high-severity vulnerabilities |
| CodeQL | Static security analysis for JavaScript, Python and workflows |
