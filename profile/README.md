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

Clients — the CLI, a [VS Code extension](https://github.com/nimbus-agent/nimbus-vscode), and a Tauri 2.0 desktop app — talk to the headless Gateway over local JSON-RPC 2.0 IPC. A [browser web clipper](https://github.com/nimbus-agent/nimbus-web-clipper) (Chrome + Firefox) saves what you read straight into your index over the gateway's paired, local HTTP surface. Install the gateway + CLI via Homebrew, Scoop, or native installers (`.msi` / `.pkg` / `.rpm`).

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
| [**Nimbus**](https://github.com/nimbus-agent/Nimbus) | The monorepo — Gateway, CLI, desktop UI, and first-party MCP connectors |
| [**nimbus-sdk**](https://github.com/nimbus-agent/nimbus-sdk) | `@nimbus-dev/sdk` — MIT, dependency-free authoring contract for MCP connectors & extensions (published to npm) |
| [**nimbus-client**](https://github.com/nimbus-agent/nimbus-client) | `@nimbus-dev/client` — MIT typed JSON-RPC 2.0 IPC client for the gateway, used by the CLI & extensions (published to npm) |
| [**nimbus-vscode**](https://github.com/nimbus-agent/nimbus-vscode) | VS Code / Open VSX extension — ask + search your index from the editor |
| [**nimbus-web-clipper**](https://github.com/nimbus-agent/nimbus-web-clipper) | Chrome + Firefox (MV3) browser extension — clip articles & selections into your index |
| [**homebrew-tap**](https://github.com/nimbus-agent/homebrew-tap) | Homebrew distribution channel |
| [**scoop-bucket**](https://github.com/nimbus-agent/scoop-bucket) | Scoop distribution channel |
| [**linux-repo**](https://github.com/nimbus-agent/linux-repo) | Linux (apt / yum) package distribution channel |
| [**awesome-nimbus**](https://github.com/nimbus-agent/awesome-nimbus) | Curated connectors, recipes, extensions & community resources |
| [**nimbus-security**](https://github.com/nimbus-agent/nimbus-security) | Security model, invariant catalogue & vulnerability disclosure |
| [**nimbus-benchmarks**](https://github.com/nimbus-agent/nimbus-benchmarks) | Public performance benchmarks & trend dashboards |

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
