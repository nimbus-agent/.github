# Nimbus

**A local-first AI agent framework.** Your machine is the source of truth; the cloud is just a connector.

Nimbus is a headless agent runtime that builds a private, on-device index of your work across ~80 cloud services, then executes multi-step agentic workflows on your behalf — without your data ever leaving your machine unless *you* approve it.

---

## Why Nimbus

- 🔒 **Local-first** — a private SQLite index lives on your machine. Cloud services are connectors, never the system of record.
- 🧑‍⚖️ **Human-in-the-loop is structural** — the consent gate lives in the execution engine, not in a prompt. It cannot be bypassed or configured away.
- 🔑 **No plaintext credentials** — secrets live only in the OS vault (Windows DPAPI / macOS Keychain / Linux libsecret). Never in logs, IPC, or config.
- 🔌 **MCP-native** — every integration is a Model Context Protocol connector. The engine never calls a cloud API directly.
- 🖥️ **Platform equality** — Windows, macOS, and Linux are first-class. CI gates on all three.

## What it connects to

A growing roster of ~80 first-party connectors across Google, Microsoft 365, GitHub, GitLab, Slack, Jira, and Notion — plus observability, CI/CD, security & quality, feature-flags, GitOps, data & BI, deployment, finance, and support tools. Optional local-filesystem indexing rounds it out.

## How you talk to it

Clients (CLI, and a Tauri 2.0 desktop app) speak to the headless Gateway only over JSON-RPC 2.0 IPC. Install via Homebrew, Scoop, native installers (`.msi` / `.pkg` / `.rpm`), or the VS Code extension.

```bash
# Homebrew (macOS / Linux)
brew install nimbus-agent/tap/nimbus

# Scoop (Windows)
scoop bucket add nimbus https://github.com/nimbus-agent/scoop-bucket
scoop install nimbus
```

Local inference is supported through Ollama, so `nimbus ask` can run entirely offline.

## Repositories

| Repo | What it is |
| --- | --- |
| [**Nimbus**](https://github.com/nimbus-agent/Nimbus) | The monorepo — Gateway, CLI, desktop UI, SDK, and first-party MCP connectors |
| [**homebrew-tap**](https://github.com/nimbus-agent/homebrew-tap) | Homebrew distribution channel |
| [**scoop-bucket**](https://github.com/nimbus-agent/scoop-bucket) | Scoop distribution channel |
| [**linux-repo**](https://github.com/nimbus-agent/linux-repo) | Linux package distribution channel |

## Architecture at a glance

- **Runtime:** Bun v1.2+ · TypeScript (strict) · Biome
- **Engine:** multi-step executor with a structural HITL consent gate
- **Index:** local SQLite with hybrid embedding search
- **Connectors:** sandboxed first-party MCP servers
- **License:** AGPL-3.0 (Gateway / CLI / connectors) + MIT (SDK & client)

## Security

Security is enforced as code, not convention: a numbered set of **security invariants**, each with a production wiring site, a docs entry, and an enforcement test that all land in the same commit. Secret scanning with push protection, Dependabot, SHA-pinned GitHub Actions, and protected release branches & tags back the supply chain.

Found something? Please report it responsibly via a private security advisory on the [Nimbus repo](https://github.com/nimbus-agent/Nimbus/security/advisories).

---

<sub>Built to keep your data yours. 🌩️</sub>
