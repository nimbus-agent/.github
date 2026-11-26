# ☁️ Nimbus

**A private, local-first agent for on-call and platform engineers.** It answers from your own index and keeps a verifiable record of what it dispatched off your machine.

[**Docs**](https://nimbus-agent.dev) · [**Install**](https://github.com/nimbus-agent/Nimbus/blob/main/docs/install.md) · [**Gateway repo**](https://github.com/nimbus-agent/Nimbus) · [**Discussions**](https://github.com/nimbus-agent/Nimbus/discussions)

```bash
nimbus init                 # index the repo you're standing in, with no account and no API key
nimbus why src/auth.ts:42   # who wrote this line, when, and in which commit
nimbus demo                 # or try a seeded synthetic org first, isolated from your real data
```

`nimbus why` answers from your local git history, with no LLM, no API key and no cloud account. Connect GitHub, a ticket tracker and an incident tool, let them sync, and the same command adds the pull request that carried the change, the ticket that asked for it and the incident it touched.

---

## Know · Act · Prove

- 🧠 **Know.** A headless Gateway keeps a private SQLite index of your tools on your machine: source control, CI/CD, cloud, monitoring, incidents, tickets and chat, across about 95 services. Cloud services are connectors, never the system of record. There is no Nimbus server.
- ✋ **Act.** Every write, send or delete stops at a human-in-the-loop gate that lives in the executor, not in a prompt, so it cannot be talked or configured away. You see a typed preview and the target's current state before anything changes. Outside coding agents (Claude Code, Codex, any MCP client) can *propose* only the connector writes you approved for them by name, and you approve each one in `nimbus approvals`.
- 🧾 **Prove.** Every action Nimbus dispatches is written to an append-only, BLAKE3-chained egress ledger *before* it goes out. `nimbus prove --since 24h` shows what Nimbus dispatched, and `nimbus prove --by-proposer` breaks it down by agent.

**What it does not guard:** the gate and the ledger cover actions that pass through Nimbus. An agent that holds its own credentials or can run commands can act outside it. Until desktop approval ships, an agent that can run commands in your terminal can still approve its own proposals. The ledger records dispatched actions, not network traffic, and agent labels are the client's own claim, always shown as UNVERIFIED.

## Other principles

- 🔑 **No plaintext credentials.** In the gateway, secrets live only in the OS vault (Windows DPAPI / macOS Keychain / Linux libsecret), never in logs, IPC or config.
- 🔌 **MCP in both directions.** Every integration is a Model Context Protocol connector, sandboxed per OS, and the engine never calls a cloud API directly. Nimbus is also an MCP *server*, so any MCP client can reach your index and the built-in agents.
- 🖥️ **Platform equality.** Windows, macOS and Linux are first-class, and every PR gates on all three.
- 🏠 **Local inference.** With Ollama, `nimbus ask` runs entirely offline. Telemetry is opt-in and off by default.

## Install

```bash
brew install nimbus-agent/tap/nimbus          # macOS / Linux (Homebrew)
winget install NimbusAgent.Nimbus             # Windows (winget)
scoop bucket add nimbus https://github.com/nimbus-agent/scoop-bucket
scoop install nimbus                          # Windows (Scoop)
```

There is also a signed apt / dnf repository, and direct `.msi`, `.pkg`, `.deb`, `.rpm` and AppImage downloads, all checksummed and GPG-signed. See the [install guide](https://github.com/nimbus-agent/Nimbus/blob/main/docs/install.md).

**Bring your agent:** `nimbus agent install claude-code` (or `codex`, `cursor`, `vscode`) writes the Nimbus MCP entry into that agent's own config after showing you every change. Any other MCP client can use `npx -y @nimbus-dev/mcp`.

**Clients:** the CLI and TUI, a [VS Code extension](https://github.com/nimbus-agent/nimbus-vscode) and a [browser web clipper](https://github.com/nimbus-agent/nimbus-web-clipper) (Chrome + Firefox). A Tauri 2.0 desktop app is built but not yet released; it is planned as `desktop-v0.1.0`. Every client talks to the Gateway over local JSON-RPC 2.0 IPC.

## Repositories

| Repo | What it is |
| --- | --- |
| [**Nimbus**](https://github.com/nimbus-agent/Nimbus) | The gateway: Gateway, CLI and desktop UI; it bundles the first-party connectors |
| [**nimbus-mcp-servers**](https://github.com/nimbus-agent/nimbus-mcp-servers) | `@nimbus-dev/connectors`: the first-party MCP connectors in one package; each also runs standalone for any MCP client, without the gateway's vault, sandbox or ledger |
| [**nimbus-mcp**](https://github.com/nimbus-agent/nimbus-mcp) | `@nimbus-dev/mcp`: launcher for the Nimbus MCP server, so any MCP client reaches your index and agents |
| [**nimbus-sdk**](https://github.com/nimbus-agent/nimbus-sdk) | `@nimbus-dev/sdk`: MIT, dependency-free authoring contract for MCP connectors and extensions |
| [**nimbus-client**](https://github.com/nimbus-agent/nimbus-client) | `@nimbus-dev/client`: MIT typed JSON-RPC 2.0 IPC client for the gateway, used by the CLI and extensions |
| [**nimbus-vscode**](https://github.com/nimbus-agent/nimbus-vscode) | VS Code / Open VSX extension: ask and search your index from the editor |
| [**nimbus-web-clipper**](https://github.com/nimbus-agent/nimbus-web-clipper) | Chrome + Firefox (MV3) extension: recognises the page you are on and runs the agents against it; also clips articles and selections into your index |
| [**create-nimbus-connector**](https://github.com/nimbus-agent/create-nimbus-connector) | Scaffolding generator for first-party-style MCP connectors |
| [**nimbus-trust**](https://github.com/nimbus-agent/nimbus-trust) | The signed trust feed every install applies: key revocations, takedowns and verified publishers |
| [**nimbus-security**](https://github.com/nimbus-agent/nimbus-security) | Security model and vulnerability disclosure |
| [**nimbus-benchmarks**](https://github.com/nimbus-agent/nimbus-benchmarks) | Public performance benchmarks and trend dashboards |
| [**awesome-nimbus**](https://github.com/nimbus-agent/awesome-nimbus) | Curated connectors, recipes, extensions and community resources |
| [**homebrew-tap**](https://github.com/nimbus-agent/homebrew-tap) · [**scoop-bucket**](https://github.com/nimbus-agent/scoop-bucket) · [**linux-repo**](https://github.com/nimbus-agent/linux-repo) | Distribution channels: Homebrew, Scoop and the signed apt / yum repository |

How the pieces fit together: [ECOSYSTEM.md](https://github.com/nimbus-agent/.github/blob/main/ECOSYSTEM.md).

## Security

Security is enforced as code, not convention. Nimbus keeps a numbered catalogue of [security invariants](https://github.com/nimbus-agent/Nimbus/blob/main/docs/SECURITY-INVARIANTS.md), and each one has a production wiring site, a docs entry and an enforcement test that land in the same commit. Static structure audits fail the build before the tests run. Secret scanning with push protection, SHA-pinned GitHub Actions, signed releases and immutable release tags back the supply chain.

Found something? Please report it privately through a [security advisory](https://github.com/nimbus-agent/Nimbus/security/advisories) on the Nimbus repo. The policy is in [nimbus-security](https://github.com/nimbus-agent/nimbus-security).

## Get involved

- Start with a [`good first issue`](https://github.com/nimbus-agent/Nimbus/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22), and read [CONTRIBUTING](https://github.com/nimbus-agent/Nimbus/blob/main/docs/CONTRIBUTING.md).
- Ask questions and share recipes in [Discussions](https://github.com/nimbus-agent/Nimbus/discussions).
- Build a connector with [`create-nimbus-connector`](https://github.com/nimbus-agent/create-nimbus-connector) and the [SDK](https://github.com/nimbus-agent/nimbus-sdk).

**License:** AGPL-3.0 (Gateway, CLI, connectors) · MIT (SDK and client)

---

<sub>Built to keep your data yours. 🌩️</sub>
