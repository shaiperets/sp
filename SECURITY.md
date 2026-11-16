# Security Policy

## Supported versions

This repository is a static website. Only the latest commit on `main` (the version that is deployed) is supported.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through GitHub's [private vulnerability reporting](https://github.com/shaiperets/sp/security/advisories/new) (Security tab, then "Report a vulnerability").

Please include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept
- Affected files, URLs or commits

## What to expect

- Acknowledgement within **3 business days**
- An initial assessment within **7 days**
- A fix, or an agreed plan, within **30 days** for confirmed issues

You will be credited in the advisory unless you prefer to stay anonymous.

## Scope

In scope: the site's HTML, CSS and JavaScript, the CI/CD workflows in `.github/`, and anything in this repository that could leak personal data (for example image metadata).

Out of scope: third-party services the site loads (Google Fonts, cdnjs, jsDelivr) and LinkedIn. Report those to their owners.

## Security practices in this repository

- CodeQL code scanning on every pull request and weekly
- Secret scanning with push protection
- Dependabot alerts and weekly version updates for npm and GitHub Actions
- Dependency review on pull requests
- GitHub Actions pinned to full commit SHAs, with least-privilege `GITHUB_TOKEN` permissions
- Image EXIF/GPS metadata stripped before commit
