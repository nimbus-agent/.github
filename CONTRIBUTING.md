# Contributing to Nimbus

Thanks for your interest in contributing! This is the org-wide default guide.
Individual repositories may include their own `CONTRIBUTING.md` with more
specific instructions — when present, that file takes precedence.

## Ways to contribute

- **File issues** — bugs, connector requests, and feature ideas are all welcome.
- **Start a discussion** — for anything open-ended or before a large change, open
  a thread in [Discussions](https://github.com/nimbus-agent/Nimbus/discussions).
- **Build connectors & recipes** — extend the ecosystem; see the main
  [Nimbus](https://github.com/nimbus-agent/Nimbus) repo and its docs.
- **Send a PR** — see the workflow below.

## Pull request workflow

1. Open an issue or discussion first for non-trivial changes, so we can agree on
   the approach before you invest time.
2. Branch from `main` using a descriptive name (e.g. `dev/<you>/<topic>`).
3. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit
   messages (`feat:`, `fix:`, `docs:`, `chore:`, …).
4. Include tests and docs for behavioural changes. Keep PRs focused.
5. Make sure the project's checks pass locally before opening the PR.

## Code of Conduct

All participation is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md).
Be respectful and constructive.

## License

By contributing, you agree that your contributions are licensed under the same
license as the repository you are contributing to (AGPL-3.0 for the core
gateway/CLI/connectors; MIT for the SDK/client). See each repository's `LICENSE`.
